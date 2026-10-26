import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw badRequest('Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw badRequest('Activity user and team must exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('Team mascot is required');
  if (members !== undefined && (!Array.isArray(members) || !members.every(isObjectId))) {
    throw badRequest('Team members must be valid user IDs');
  }

  const memberIds = [...new Set(members === undefined ? [] : members.filter(isObjectId))];
  const existingMembers = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select('_id team').lean()
    : [];
  if (existingMembers.length !== memberIds.length) throw badRequest('All team members must exist');

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length) {
    await Promise.all(existingMembers.map(async (member) => {
      if (member.team) {
        await Team.updateOne({ _id: member.team }, { $pull: { members: member._id } });
      }
    }));
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const activityFocus = recentActivity
    ? (/^(run|cycle|cardio|endurance)$/i.test(recentActivity.type)
      ? 'endurance'
      : /^(strength|weights?)$/i.test(recentActivity.type)
        ? 'strength'
        : /^(walk|mobility|stretch)$/i.test(recentActivity.type)
          ? 'mobility'
          : recentActivity.type)
    : undefined;
  const matchesFocus = (focus: string) => workouts.filter(
    (workout) => workout.focus.toLowerCase() === focus.toLowerCase(),
  );
  const goalWorkouts = matchesFocus(user.fitnessGoal);
  const selectedFocus = goalWorkouts.length ? user.fitnessGoal : activityFocus;
  if (!selectedFocus) return [];

  const reason = selectedFocus.toLowerCase() === user.fitnessGoal.toLowerCase()
    ? `Matches your ${user.fitnessGoal} goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
    : `Based on your recent ${recentActivity?.type} activity.`;
  return matchesFocus(selectedFocus).map((workout) => ({ ...workout, reason }));
}

export { User };

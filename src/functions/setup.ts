import {ContributionData, Language} from '../Types';
import {UserStats} from '../config';
import * as fs from 'fs';
import path from 'path';

export async function getUsersStatsFromGithub(usernames: string[]) {
	if (typeof window !== 'undefined') return [];
	
	const stats: UserStats[] = [];
	if (!usernames || !Array.isArray(usernames)) return stats;

	for (const username of usernames) {
		const localPath = path.join(process.cwd(), 'github-user-stats.json');

		if (fs.existsSync(localPath)) {
			console.log(`Loading local stats for ${username}...`);
			const data = fs.readFileSync(localPath, 'utf8');
			stats.push(JSON.parse(data));
		} else {
			throw new Error(`Could not find local stats file at ${localPath}. Run generate-stats first.`);
		}

		return stats;
	}

	return stats;
}

export function mergeUsersStats(stats: UserStats[]): UserStats {
	const userStats = stats[0];

	for (const stat of stats.slice(1)) {
		userStats.closedIssues += stat.closedIssues;
		userStats.starCount += stat.starCount;
		userStats.openIssues += stat.openIssues;
		userStats.topLanguages = [...userStats.topLanguages, ...stat.topLanguages];
		userStats.totalCommits += stat.totalCommits;
		userStats.totalContributions += stat.totalContributions;
		userStats.totalPullRequests += stat.totalPullRequests;
		userStats.repoViews += stat.repoViews;
		userStats.linesOfCodeChanged += stat.linesOfCodeChanged;
		userStats.linesAdded += stat.linesAdded;
		userStats.linesDeleted += stat.linesDeleted;
		userStats.linesChanged += stat.linesChanged;
		userStats.codeByteTotal += stat.codeByteTotal;
		userStats.forkCount += stat.forkCount;

		userStats.contributionsCollection.totalCommitContributions +=
			stat.contributionsCollection.totalCommitContributions;
		userStats.contributionsCollection.restrictedContributionsCount +=
			stat.contributionsCollection.restrictedContributionsCount;
		userStats.contributionsCollection.totalIssueContributions +=
			stat.contributionsCollection.totalIssueContributions;
		userStats.contributionsCollection.totalRepositoryContributions +=
			stat.contributionsCollection.totalRepositoryContributions;
		userStats.contributionsCollection.totalPullRequestContributions +=
			stat.contributionsCollection.totalPullRequestContributions;
		userStats.contributionsCollection.totalPullRequestReviewContributions +=
			stat.contributionsCollection.totalPullRequestReviewContributions;

		userStats.contributionsCollection.contributionCalendar.totalContributions +=
			stat.contributionsCollection.contributionCalendar.totalContributions;

		userStats.contributionsCollection.contributionCalendar.weeks.push(
			...stat.contributionsCollection.contributionCalendar.weeks
		);
	}

	return userStats;
}

export function convertWeeksToDays(stats: UserStats) {
	const days: ContributionData[] = [];

	for (const week of stats.contributionsCollection.contributionCalendar.weeks) {
		days.push(...week.contributionDays);
	}

	stats.contributionCalendar = days;
}

export function sortAndMergeContributionData(userStats: UserStats) {
	userStats.contributionCalendar.sort(
		(a: ContributionData, b: ContributionData) => {
			// @ts-expect-error This is a valid comparison
			return new Date(a.date) - new Date(b.date);
		}
	);

	for (
		let index = 0;
		index < userStats.contributionCalendar.length - 1;
		index++
	) {
		if (
			userStats.contributionCalendar[index].date ===
			userStats.contributionCalendar[index + 1].date
		) {
			userStats.contributionCalendar[index].contributionCount +=
				userStats.contributionCalendar[index + 1].contributionCount;
			userStats.contributionCalendar.splice(index + 1, 1);
		}
	}
}

export function sortAndMergeTopLanguages(userStats: UserStats): UserStats {
	const topLanguages: Language[] = [];
	for (const language of userStats.topLanguages) {
		if (
			topLanguages.some((lang) => lang.languageName === language.languageName)
		)
			continue;
		const tempLang: Language = {
			languageName: language.languageName,
			color: language.color,
			value: 0,
		};
		for (const lang of userStats.topLanguages.filter(
			(lang: Language) => lang.languageName === language.languageName
		)) {
			tempLang.value += lang.value;
		}
		topLanguages.push(tempLang);
	}

	topLanguages.sort((a, b) => {
		return b.value - a.value;
	});

	userStats.topLanguages = topLanguages;

	return userStats;
}

export async function getUserStats(usernames: string[]) {
	const stats = getUsersStatsFromGithub(usernames);
	let userStats = mergeUsersStats(await stats);
	convertWeeksToDays(userStats);
	sortAndMergeContributionData(userStats);
	userStats = sortAndMergeTopLanguages(userStats);
	return userStats;
}

if (require.main === module) {
	const usernames = ['jepsterrr'];
	getUserStats(usernames)
		.then((stats) => {
			fs.writeFileSync('./input.json', JSON.stringify({userStats: stats}, null, 2));
			console.log('Successfully updated input.json with fresh stats!');
		})
		.catch((err) => {
			console.error('Error updating stats:', err);
			process.exit(1);
		});
}

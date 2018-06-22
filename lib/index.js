'use strict';

const fs = require('fs');
const date = new Date().toISOString().slice(0, 10);
const changelogFileName = 'CHANGELOG.md';

function updateUpperSection(changelog, version) {
	return changelog.replace(
		/## \[Unreleased\]/,
		`## [Unreleased]\n\n## [${version}] (${date})`
	);
}

function updateBottomSectionGithub(changelog, version) {
	/**
	 * matches[0] = `[Unreleased]: https://github.com/nikolajevp/changelog-updater/compare/v1.0.0...HEAD`
	 * matches[1] = ` https://github.com/nikolajevp/changelog-updater/compare/`
	 * matches[2] = `1.0.0`
	 */
	const regex = /\[Unreleased\]:(.+\/)v(.+)\.\.\.HEAD/i;
	const matches = changelog.match(regex);

	if (matches) {
		const url = matches[1];
		const previousVersion = matches[2];
		const compareToUnreleased = `[Unreleased]:${url}v${version}...HEAD`;
		const compareToLatestVersion = `[${version}]:${url}v${previousVersion}...v${version}`;

		changelog = changelog.replace(
			regex,
			`${compareToUnreleased}\n${compareToLatestVersion}`
		);
	}

	return changelog;
}

function updateBottomSectionBitbucket(changelog, version) {
	/**
	 * matches[0] = `[Unreleased]: https://bitbucket.org/nikolajevp/changelog-updater/branches/compare/HEAD..v1.0.0`
	 * matches[1] = ` https://bitbucket.org/nikolajevp/changelog-updater/branches/compare/`
	 * matches[2] = `1.0.0`
	 */
	const regex = /\[Unreleased\]:(.+)HEAD\.\.v(.+)/i;
	const matches = changelog.match(regex);

	if (matches) {
		const url = matches[1];
		const previousVersion = matches[2];
		const compareToUnreleased = `[Unreleased]:${url}HEAD..v${version}`;
		const compareToLatestVersion = `[${version}]:${url}v${version}..v${previousVersion}`;

		changelog = changelog.replace(
			regex,
			`${compareToUnreleased}\n${compareToLatestVersion}`
		);
	}

	return changelog;
}

function updateBottomSectionRedmine(changelog, version) {
	/**
	 * matches[0] = `[Unreleased]: https://redmine/projects/projectName/repository/diff?utf8=%E2%9C%93&rev=10.16.5&rev_to=HEAD`
	 * matches[1] = ` https://redmine/projects/projectName/repository/diff?utf8=%E2%9C%93&rev=`
	 * matches[2] = `10.16.5`
	 */
	const regex = /\[Unreleased\]:(.+\/.+)rev=(.+)&rev_to=HEAD/i;
	const matches = changelog.match(regex);

	if (matches) {
		const url = matches[1];
		const previousVersion = matches[2];
		const compareToUnreleased = `[Unreleased]:${url}rev=${version}&rev_to=HEAD`;
		const compareToLatestVersion = `[${version}]:${url}rev=${previousVersion}&rev_to=${version}`;

		changelog = changelog.replace(
			regex,
			`${compareToUnreleased}\n${compareToLatestVersion}`
		);
	}

	return changelog;
}

function getVersion(done) {
	let v = process.env.npm_package_version;
	if (v) {
		return done(v);
	}
	fs.readFile('package.json', 'utf8', (err, p) => {
		if (err) {
			throw err;
		}
		let pack = JSON.parse(p);
		done(pack.version);
	});
}

function updateChangelog(done = () => {}, filePath = changelogFileName) {
	fs.readFile(filePath, 'utf8', (err, changelog) => {
		if (err) {
			throw err;
		}
		getVersion((version) => {
			changelog = updateUpperSection(changelog, version);
			changelog = updateBottomSectionGithub(changelog, version);
			changelog = updateBottomSectionBitbucket(changelog, version);
			changelog = updateBottomSectionRedmine(changelog, version);

			fs.writeFile(filePath, changelog, 'utf8', (err) => {
				if (err) {
					throw err;
				}
				done(err);
			});
		});
	});
}

module.exports = updateChangelog;

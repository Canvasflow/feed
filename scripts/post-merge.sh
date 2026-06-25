#!/usr/bin/env sh
# post-merge hook — auto-updates CHANGELOG.md when a release/hotfix merges into main.
#
# Git sets MERGE_HEAD during a merge commit, but by the time the hook fires the
# merge is already committed. We use HEAD^1 (the pre-merge tip of the target
# branch) and HEAD^2 (the tip of the merged branch) to reconstruct the range.
#
# Only fires when the current branch is main; silent on other branches.

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] || exit 0

# HEAD^2 is only available after a real merge (not a fast-forward).
git rev-parse --verify HEAD^2 > /dev/null 2>&1 || exit 0

node scripts/update-changelog.mjs --base HEAD^1 --tip HEAD^2

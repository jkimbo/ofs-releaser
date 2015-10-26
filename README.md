# ofs-releaser

Release projects the 'onefinestay' way.

## Installation

```
npm install -g ofs-releaser
```

## Instructions

* Navigate to the project directory that you want to release
* Ensure that the git working directory is clean
* Export `GITHUB_TOKEN` to your shell env with your github access token
* Run `releaser --name <new-release-name>`
* This will create a new branch called `name`, grab all the pull requests of that repo that has the label `ready`, merge them into `name` and then create a new pull request with the release details

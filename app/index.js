'use strict';
var util = require('util');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var GithubApi = require('github');
var changeCase = require('change-case');

var github = new GithubApi({
    version: '3.0.0'
});
if (process.env.GITHUB_TOKEN) {
    github.authenticate({
        type: 'oauth',
        token: process.env.GITHUB_TOKEN
    });
}

var NodeJsperGenerator = yeoman.generators.Base.extend({
    initializing: function () {
    },

    prompting: function () {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay('Welcome to the awesome node.jsper generator!'));

        var prompts = [{
            type: 'input',
            name: 'projectName',
            message: 'What is the project name?',
            validate: function(projectName) {
                if (!projectName) {
                    return 'Project must have a name';
                }
                else {
                    return true;
                }
            }
        }, {
            type: 'input',
            name: 'projectDesc',
            message: 'What is the project description?',
            default: ''
        }];

        this.prompt(prompts, function (props) {
            this.projectName = props.projectName;
            this.projectDesc = props.projectDesc;
            done();
        }.bind(this));
    },

    configuring: function() {
        var done = this.async();

        this.destinationRoot(changeCase.paramCase(this.projectName));
        this.projectIndex = util.format('lib/%s.js',
                                        changeCase.camelCase(this.projectName));

        github.repos.create({
            name: this.projectName,
            description: this.projectDesc
        }, function(err, result) {
            if (err) {
                throw err;
            }
            this.gitLink = result.git_url;
            this.gitPage = result.html_url;
            this.gitIssues = result.issues_url.replace('{/number}', '');
            this.gitSSH = result.ssh_url;
            done();
        }.bind(this));
    },

    writing: function() {
        this.copy('gitignore', '.gitignore');
        this.copy('npmignore', '.npmignore');
        this.copy('editorconfig', '.editorconfig');
        this.copy('jshintrc', '.jshintrc');

        this.template('_package.json', 'package.json');
        this.mkdir('lib');
        this.copy('index.js', this.projectIndex);
        this.mkdir('examples');
        this.template('_README.md', 'README.md');
    },

    install: function() {
        this.npmInstall();
    },

    end: function() {
        this.spawnCommand('git', ['init']);
        this.spawnCommand('git', ['add', '.']);
        this.spawnCommand('git', ['commit',  '-m', 'First commit.']);
        this.spawnCommand('git', ['remote', 'add', 'origin', this.gitSSH]);
        this.spawnCommand('git', ['push', 'origin', 'master', '-u']);
    }
});

module.exports = NodeJsperGenerator;

var _ = require('lodash'),
    debug = require('debug')('freecc:cntr:bonfires'),
    Bonfire = require('./../models/Bonfire'),
    User = require('./../models/User'),
    resources = require('./resources');

/**
 * Bonfire controller
 */

exports.bonfireNames = function(req, res) {
    res.render('bonfires/showList', {
        bonfireList: resources.allBonfireNames()
    });
};

exports.index = function(req, res) {
    res.render('bonfire/show.jade', {
        completedWith: null,
        title: 'Bonfire Playground',
        name: 'Bonfire Playground',
        difficulty: 0,
        brief: 'Feel free to play around!',
        details: '',
        tests:  [],
        challengeSeed:  '',
        cc: req.user ? req.user.bonfiresHash : undefined,
        points: req.user ? req.user.points : undefined,
        verb: resources.randomVerb(),
        phrase: resources.randomPhrase(),
        compliments: resources.randomCompliment(),
        bonfires: [],
        bonfireHash: 'test'

    });
};

exports.returnNextBonfire = function(req, res) {
    if (!req.user) {
        return res.redirect('../bonfires/meet-bonfire');
    }
    var completed = req.user.completedBonfires.map(function (elem) {
        return elem._id;
    });

    req.user.uncompletedBonfires = resources.allBonfireIds().filter(function (elem) {
        if (completed.indexOf(elem) === -1) {
            return elem;
        }
    });
    req.user.save();

    var uncompletedBonfires = req.user.uncompletedBonfires;

    var displayedBonfires =  Bonfire.find({'_id': uncompletedBonfires[0]});
    displayedBonfires.exec(function(err, bonfire) {
        if (err) {
            next(err);
        }
        bonfire = bonfire.pop();
        if (bonfire === undefined) {
            req.flash('errors', {
                msg: "It looks like you've completed all the bonfires we have available. Good job!"
            });
            return res.redirect('../bonfires/meet-bonfire');
        }
        nameString = bonfire.name.toLowerCase().replace(/\s/g, '-');
        return res.redirect('../bonfires/' + nameString);
    });
};

exports.returnIndividualBonfire = function(req, res, next) {
    var dashedName = req.params.bonfireName;

    bonfireName = dashedName.replace(/\-/g, ' ');

    Bonfire.find({"name" : new RegExp(bonfireName, 'i')}, function(err, bonfire) {
        if (err) {
            next(err);
        }


        if (bonfire.length < 1) {
            req.flash('errors', {
                msg: "404: We couldn't find a bonfire with that name. Please double check the name."
            });

            return res.redirect('/bonfires');
        }

        bonfire = bonfire.pop();
        var dashedNameFull = bonfire.name.toLowerCase().replace(/\s/g, '-');
        if (dashedNameFull != dashedName) {
            return res.redirect('../bonfires/' + dashedNameFull);
        }

        res.render('bonfire/show', {
            completedWith: null,
            title: bonfire.name,
            dashedName: dashedName,
            name: bonfire.name,
            difficulty: Math.floor(+bonfire.difficulty),
            brief: bonfire.description[0],
            details: bonfire.description.slice(1),
            tests: bonfire.tests,
            challengeSeed: bonfire.challengeSeed,
            cc: !!req.user,
            points: req.user ? req.user.points : undefined,
            verb: resources.randomVerb(),
            phrase: resources.randomPhrase(),
            compliment: resources.randomCompliment(),
            bonfires: bonfire,
            bonfireHash: bonfire._id

        });
    });
};

/**
 * Bonfire generator
 */
exports.returnGenerator = function(req, res) {
    res.render('bonfire/generator', {
        title: null,
        name: null,
        difficulty: null,
        brief: null,
        details: null,
        tests: null,
        challengeSeed: null,
        bonfireHash: randomString()
    });
};

/**
 * Post for bonfire generation
 */

function randomString() {
    var chars = "0123456789abcdef";
    var string_length = 23;
    var randomstring = 'a';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
};

/**
 *
 */

exports.testBonfire = function(req, res) {
    var bonfireName = req.body.name,
        bonfireTests = req.body.tests,
        bonfireDifficulty = req.body.difficulty,
        bonfireDescription = req.body.description,
        bonfireChallengeSeed = req.body.challengeSeed;
    bonfireTests = bonfireTests.split('\r\n');
    bonfireDescription = bonfireDescription.split('\r\n');
    bonfireTests.filter(getRidOfEmpties);
    bonfireDescription.filter(getRidOfEmpties);
    bonfireChallengeSeed = bonfireChallengeSeed.replace('\r', '');
    res.render('bonfire/show', {
        completedWith: null,
        title: bonfireName,
        name: bonfireName,
        difficulty: +bonfireDifficulty,
        brief: bonfireDescription[0],
        details: bonfireDescription.slice(1),
        tests:  bonfireTests,
        challengeSeed:  bonfireChallengeSeed,
        cc: req.user ? req.user.bonfiresHash : undefined,
        points: req.user ? req.user.points : undefined,
        verb: resources.randomVerb(),
        phrase: resources.randomPhrase(),
        compliment: resources.randomCompliment(),
        bonfires: [],
        bonfireHash: "test"
    });
};

function getRidOfEmpties(elem) {
    if (elem.length > 0) {
        return elem;
    }
};

exports.publicGenerator = function(req, res) {
    res.render('bonfire/public-generator');
};

exports.generateChallenge = function(req, res) {
    var bonfireName = req.body.name,
        bonfireTests = req.body.tests,
        bonfireDifficulty = req.body.difficulty,
        bonfireDescription = req.body.description,
        bonfireChallengeSeed = req.body.challengeSeed;
    bonfireTests = bonfireTests.split('\r\n');
    bonfireDescription = bonfireDescription.split('\r\n');
    bonfireTests.filter(getRidOfEmpties);
    bonfireDescription.filter(getRidOfEmpties);
    bonfireChallengeSeed = bonfireChallengeSeed.replace('\r', '');


    var response = {
        _id: randomString(),
        name: bonfireName,
        difficulty: bonfireDifficulty,
        description: bonfireDescription,
        challengeSeed: bonfireChallengeSeed,
        tests: bonfireTests
    };
    res.send(response);
};

exports.completedBonfire = function (req, res) {
    var isCompletedWith = req.body.bonfireInfo.completedWith || undefined;
    var isCompletedDate = Math.round(+new Date() / 1000);
    var bonfireHash = req.body.bonfireInfo.bonfireHash;
    var isSolution = req.body.bonfireInfo.solution;

    if (isCompletedWith) {
        var paired = User.find({"profile.username": isCompletedWith.toLowerCase()}).limit(1);
        paired.exec(function (err, pairedWith) {
            if (err) {
                return err;
            } else {
                var index = req.user.uncompletedBonfires.indexOf(bonfireHash);
                if (index > -1) {
                    req.user.points++;
                    req.user.uncompletedBonfires.splice(index, 1)
                }
                pairedWith = pairedWith.pop();

                index = pairedWith.uncompletedBonfires.indexOf(bonfireHash);
                if (index > -1) {
                    pairedWith.points++;
                    pairedWith.uncompletedBonfires.splice(index, 1);

                }

                pairedWith.completedBonfires.push({
                    _id: bonfireHash,
                    completedWith: req.user._id,
                    completedDate: isCompletedDate,
                    solution: isSolution
                });

                req.user.completedBonfires.push({
                    _id: bonfireHash,
                    completedWith: pairedWith._id,
                    completedDate: isCompletedDate,
                    solution: isSolution
                })

                req.user.save(function (err, user) {
                    pairedWith.save(function (err, paired) {
                        if (err) {
                            throw err;
                        }
                        if (user && paired) {
                            res.send(true);
                        }
                    })
                });
            }
        })
    } else {

        req.user.completedBonfires.push({
            _id: bonfireHash,
            completedWith: null,
            completedDate: isCompletedDate,
            solution: isSolution
        });

        var index = req.user.uncompletedBonfires.indexOf(bonfireHash);
        if (index > -1) {
            req.user.points++;
            req.user.uncompletedBonfires.splice(index, 1)
        }

        req.user.save(function (err, user) {
            if (err) {
                throw err;
            }
            if (user) {
                debug('Saving user');
                res.send(true)
            }
        });
    }
};
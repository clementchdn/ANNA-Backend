'use strict';

const db = require('../models');
const policy = require('../policies/user_policy');

/**
 *
 * Get all existing users.
 *
 * @param {Object} req - the user request
 * @param {Object} res - the response to be sent
 * @param {Object} handle - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.index = async function (req, res) {
    const users = await db.User.findAll();


    return res.status(200).json(users);
};


/**
 *
 * Get a single user.
 *
 * @param {obj} req     - the user request
 * @param {obj} res     - the response to be sent
 * @param {obj} handle  - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.show = async function (req, res) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    const user = await db.User.findOne({
        where: {id: userId},
        include: [
            'groups',
            'events'
        ]
    });

    if (!user) {
        throw res.boom.notFound();
    }

    return res.status(200).json(user);

};

/**
 *
 * Create a store a new user.
 *
 * @param {obj} req     - the user request.
 * @param {obj} res     - the response to be sent
 * @param {obj} handle  - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.store = async function (req, res) {

    try {
        const user = await db.User.create(req.body);


        return res.status(201).json(user);
    } catch (err) {
        if (err instanceof db.Sequelize.ValidationError) {
            throw res.boom.badRequest(err);
        }
        throw err;
    }
};

/**
 *
 * Updates an existing user.
 *
 * @param {obj} req     - The user request.
 * @param {obj} res     the response to be sent.
 * @param {obj} handle  the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.update = async function (req, res) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    const record = await db.User.findById(userId);

    try {
        await record.update(req.body);

        return res.status(204).json({});
    } catch (err) {
        if (err instanceof db.Sequelize.ValidationError) {
            throw res.boom.badRequest();
        }

        throw err;
    }
};

/**
 *
 * Deletes an existing user.
 *
 * @param {Object} req - the user request
 * @param {Object} res - the response to be sent
 * @param {Object} handle - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.delete = async function (req, res) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    try {
        await db.UserGroup.destroy({where: {userId}});
        await db.User.destroy({where: {id: userId}});

        return res.status(204).send();
    } catch (err) {
        if (err instanceof db.Sequelize.ValidationError) {
            throw res.boom.badRequest();
        }
    }
};

/**
 *
 * Get all user's posts
 * Can get altered with scopes.
 *
 * @example GET /users/:userId/posts?published=true  -> return all published posts
 * @example GET /users/:userId/posts?published=false -> return all drafted posts
 *
 * @param {obj} req     - the user request
 * @param {obj} res     - the response to be sent
 * @param {obj} handle  - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.posts = function (req, res, handle) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    let posts = db.Post;

    if (req.query.published) {
        if (req.query.published === 'true') {
            posts = posts.scope('published');
        } else if (req.query.published === 'false') {
            posts = posts.scope('draft');
        }
    }

    return posts.findAll({where: {authorId: userId}})
        .then((response) => res.status(200).json(response))
        .catch((err) => handle(err));
};

/**
 *
 * Get all user's groups.
 *
 * @param {obj} req     the user request.
 * @param {obj} res     the response to be sent
 * @param {obj} handle  the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.getGroups = function (req, res, handle) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    return db.User.findOne({
        where: {id: userId},
        include: ['groups']
    })
        .then((user) => {
            if (user) {
                return res.status(200).json(user.groups);
            }
            throw res.boom.badRequest();

        })
        .catch((err) => handle(err));
};

/**
 *
 * Add user to group.
 *
 * @param {Object} req - the user request
 * @param {Object} res - the response to be sent
 * @param {Object} handle - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.addGroups = function (req, res, handle) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    return policy.filterAddGroups(req.body.groupsId, req.session.auth)
        .then((groups) => db.User.findById(userId)
            .then((user) => {
                if (user) {
                    return user.addGroups(groups);
                }
                throw res.boom.badRequest();

            })
            .then(() => res.status(204).send()))
        .catch((err) => handle(err));
};

/**
 *
 * Remove user from groups.
 *
 * @param {Object} req - the user request
 * @param {Object} res - the response to be sent
 * @param {Object} handle - the error handling function
 *
 * @returns {Object} promise
 *
 */
exports.deleteGroups = function (req, res, handle) {
    if (isNaN(parseInt(req.params.userId, 10))) {
        throw res.boom.badRequest();
    }
    const userId = parseInt(req.params.userId, 10);

    return policy.filterDeleteGroups(req.body.groupsId, userId, req.session.auth)
        .then((groups) => db.User.findById(userId)
            .then((user) => user.removeGroups(groups))
            .then(() => res.status(204).send()))
        .catch((err) => handle(err));
};

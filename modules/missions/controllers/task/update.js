'use strict';

const policy = require('../../mission_policy');

module.exports = (db) => async function (req, res) {
    if (isNaN(parseInt(req.params.missionId, 10))) {
        return res.boom.badRequest('Mission ID must be an integer');
    }
    const missionId = parseInt(req.params.missionId, 10);


    if (isNaN(parseInt(req.params.taskId, 10))) {
        return res.boom.badRequest('Task ID must be an integer');
    }
    const taskId = parseInt(req.params.taskId, 10);


    const mission = await db.Mission.findByPk(missionId);

    if (!mission) {
        return res.boom.notFound(`No mission with id ${missionId}`);
    }

    const task = await db.Task.findByPk(taskId);

    if (!task) {
        return res.boom.notFound(`No task with id ${taskId}`);
    }

    const updateContents = await policy.filterUpdateTask(db, req.body, req.session.auth);

    await task.update(updateContents);

    return res.status(200).json(task);

};

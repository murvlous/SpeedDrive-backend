const express = require('express')
const authMiddleware = require('../middlewares/auth')

const Project = require('../models/Project')
const Task = require('../models/Task')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async(req, res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks']);
        res.send({ projects })

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "error loading projects" });
    }
})

router.get('/:projectId', async(req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
        res.send({ project })

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "error loading project" });
    }
})

router.post('/', async(req, res) => {
    try {

        console.log(req.body)

        const { title, description, tasks } = req.body;
        const project = await Project.create({ title, description, user: req.userId });

        await Promise.all(tasks.map(async task => {
            const projectTask = await Task.create({...task, project: project._id });
            project.tasks.push(projectTask)
        }));

        await project.save();

        res.send({ project });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "error on creating user" });
    }
})

router.put('/:projectId', async(req, res) => {
    try {

        console.log(req.body)

        const { title, description, tasks } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.projectId, { title, description }, { new: true });

        project.tasks = [];
        await Task.remove({ project: project._id });

        await Promise.all(tasks.map(async task => {
            const projectTask = await Task.create({...task, project: project._id });
            project.tasks.push(projectTask)
        }));

        await project.save();

        res.send({ project });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "error on deleting user" });
    }
})

router.delete('/:projectId', async(req, res) => {
    try {
        await Project.findByIdAndRemove(req.params.projectId);
        res.send()

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "error deleting project" });
    }
})


module.exports = app => app.use('/project', router)
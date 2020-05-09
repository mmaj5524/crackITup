const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const {check, validationResult} = require("express-validator");

const CreateExam = require("../../models/CreateExam");

// POST api/exams
// Post questions
// Admin only
router.post('/', [auth, [
    check('field', 'Field is required').not().isEmpty(),
    check('dateOfConduct', 'Date of conduct is required').not().isEmpty(),
    check('time', 'Time of examination is required').not().isEmpty(),
    check('mmarks', 'Maximum marks is required').not().isEmpty()

]], async (req, res) => {

    if(req.user.admin === false) {
        return res.status(401).json({ msg: "Not Authorized for this task"});
    }

    const errors = validationResult(req);
    if(!errors.isEmpty){
        return res.status(400).json({ errors: errors.array()});
    }

    const { field, dateOfConduct, time, mmarks } = req.body;

    const examinfo = {}
    examinfo.field = field;
    examinfo.dateOfConduct = dateOfConduct;
    examinfo.time = time;
    examinfo.mmarks = mmarks;

    let exam = await CreateExam.findOne({time: req.body.time, dateOfConduct: req.body.dateOfConduct});
    if(exam) {
        return res.status(400).json({ errors: [{ msg: 'There is another examination on same date and time'}] });
    }

    exam = new CreateExam(examinfo);
    await exam.save();
    res.json(exam);

});

// GET /api/exams
// GET all the exams
// Public
router.get('/', auth, async (req, res) => {
    try {
        const exams = await CreateExam.find();
        res.json(exams);
    } catch (err) {
        console.error(err.message);
        req.status(500).send('Server Error');
    }
})

// GET api/exams/:exam_id
// get exams by ID
// Public
router.get('/:exam_id', auth,  async (req, res) => {
    try {
        
        const exam = await CreateExam.findOne({_id: req.params.exam_id})

        if(!exam) return res.status(404).json({msg: "Exam not found"})

        res.json(exam);
    } catch (err) {
        console.error(err.message);
        req.status(500).send('Server Error');
    }
});

// DELETE /api/exam/:exam_id
// Delete a exam
// Admin Only
router.delete('/:exam_id', auth, async (req, res) => {
    try {
        if(req.user.admin === false) {
            return res.status(401).json({ msg: "Not Authorized for this task"});
        }
        await CreateExam.findOneAndRemove({_id: req.params.exam_id});
        res.json({msg: 'Examination deleted'});
    } catch(err) {
        console.error(err.message);
        req.status(500).send('Server Error');
    }
    
})


// PUT api/exam/que
// ADD a question
// Admin only
router.put('/:exam_id/que', [auth, [
    check('que', 'Question is required').not().isEmpty(),
    check('ans', 'Correct Answer is required').not().isEmpty(),
    check('opts', 'All options must be filled').not().isEmpty()
]], async (req, res) => {

    if(req.user.admin === false) {
        return res.status(401).json({ msg: "Not Authorized for this task"});
    }

    const errors = validationResult(req);
    if(!errors.isEmpty){
        return res.status(400).json({ errors: errors.array()});
    }

    const {que, isSubjective, ans} = req.body;
    const newque = {que, isSubjective, ans}
    newque.opts = [];
    if(isSubjective === false) {
        newque.opts = [];
        const {opts} = req.body
        newque.opts.push(...opts);
    }

    try {
        const exam = await CreateExam.findOne({_id: req.params.exam_id})
        exam.ques.push(newque);

        await exam.save();

        res.json(exam);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// DELETE /api/exams/:exam_id/que/:que_id
// DELETE a question
// Adminn only
router.delete('/:exam_id/que/:que_id', auth, async (req, res) => {
    if(req.user.admin === false) {
        return res.status(401).json({ msg: "Not Authorized for this task"});
    }
    try {
        const exam = await CreateExam.findOne({_id: req.params.exam_id});

        // Get its remove index
        const removeIndex = exam.ques.map(que => que.id).indexOf(req.params.que_id);

        exam.ques.splice(removeIndex, 1);
        await exam.save();
        res.json({msg: 'Question Deleted'});
    } catch (err) {
        console.error(err.message);
        req.status(500).send('Server Error');
    }
})

module.exports = router;
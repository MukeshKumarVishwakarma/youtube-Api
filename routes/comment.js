const express = require('express')
const Router = express.Router()
const Comment = require('../models/Comment')
const checkAuth = require('../middleware/checkAuth')
const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')

Router.post('/new-comment/:videoId',checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const newComment = new Comment({
            _id: new mongoose.Types.ObjectId,
            videoId: req.params.videoId,
            userId: verifiedUser._id,
            commentText: req.body.commentText
        })
        const comment = await newComment.save()
        res.status(200).json({
            newComment: comment
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})

// get all comments for any video
Router.get('/:videoId', async(req, res) => {
    try {
        const comments = await Comment.find({videoId:req.params.videoId}).populate('userId','channelName logoUrl')
        res.status(200).json({
            commentList:comments
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})

// update comment
Router.put('/:commentId',checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const comment = await Comment.findById(req.params.commentId)
        console.log(comment);
        
        if (comment.userId != verifiedUser._id) {
            return res.status(500).json({
                err: 'Invalid user'
            })
        }
        comment.commentText = req.body.commentText;
        const updatedComment = await comment.save()
        res.status(200).json({
            updatedComment: updatedComment
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
    
})

//delete comment
Router.delete('/:commentId',checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const comment = await Comment.findById(req.params.commentId)
        console.log(comment);
        
        if (comment.userId != verifiedUser._id) {
            return res.status(500).json({
                err: 'Invalid user'
            })
        }
        await Comment.findByIdAndDelete(req.params.commentId)
        res.status(200).json({
            deletedData: 'success'
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})




module.exports = Router;

const express = require('express');
const Router = express.Router();
const checkAuth = require('../middleware/checkAuth')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const Video = require('../models/Video')
const mongoose = require('mongoose')


cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
});

//get own video
Router.get('/own-video',checkAuth,async(req, res)=>{
    try {
        const token = req.headers.authorization.split(" ")[1]
        const user = await jwt.verify(token, 'mukesh kumar 2725')
        console.log(user);
        const videos = await Video.find({user_id:user._id}).populate('user_id','channelName logoUrl')
        res.status(200).json({
            videos:videos
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err:error
        })
    }
})

//upload video

Router.post('/upload',checkAuth, async(req, res)=> {
    //console.log('upload video');
    try {
        const token = req.headers.authorization.split(" ")[1]
        const user = await jwt.verify(token, 'mukesh kumar 2725')
        // console.log(user);
        // console.log(req.body);
        console.log(req.files.video);
        // console.log(req.files.thumbnail);
        
        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: 'video'
        })
        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath)
        // console.log(uploadedVideo);
        // console.log(uploadedThumbnail);
        
        const newVideo = new Video({
            _id:new mongoose.Types.ObjectId,
            title: req.body.title,
            description: req.body.description,
            user_id:user._id,
            videoUrl: uploadedVideo.secure_url,
            videoId: uploadedVideo.public_id,
            thumbnailUrl:uploadedThumbnail.secure_url,
            thumbnailId:uploadedThumbnail.public_id,
            category: req.body.category,
        })
        console.log(newVideo);
        
        const newUploadedVideoData = await newVideo.save({validateBeforeSave: false})
        res.status(200).json({
            newVideo: newUploadedVideoData
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error:err
        })
    }
})

//update video detail
Router.put('/:videoId', checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        //console.log(verifiedUser);
        const video = await Video.findById(req.params.videoId)
        console.log(video);

        if (video.user_id == verifiedUser._id) {
            //update video details
            //console.log('You have permision');
            if(req.files){
                //update thumbnail and text data
                await cloudinary.uploader.destroy(video.thumbnailId)
                const updatedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath)
                const updatedData={
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    thumbnailUrl:updatedThumbnail.secure_url,
                    thumbnailId:updatedThumbnail.public_id, 
                };
                const updatedVideoDetails = await Video.findByIdAndUpdate(req.params.videoId, updatedData,{new: true})
                res.status(200).json({
                    updatedVideo: updatedVideoDetails
                })
            }else{
                const updatedData={
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                }
                const updatedVideoDetails = await Video.findByIdAndUpdate(req.params.videoId, updatedData, {new: true})
                res.status(200).json({
                    updatedVideo: updatedVideoDetails
                })
            }


        }else {
            return res.status(500).json({
                error: 'you have no permision'
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})


// delete api
Router.delete('/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const video = await Video.findById(req.params.videoId)
        if (video.user_id == verifiedUser._id) {
            //delete video, thumbnail and data from database
            await cloudinary.uploader.destroy(video.videoId,{resource_type:'video'})
            await cloudinary.uploader.destroy(video.thumbnailId)
            const deletedResponse = await Video.findByIdAndDelete(req.params.videoId)
            res.status(200).json({
                deletedResponse: deletedResponse
            })
        }else{
            return res.status(500).json({
                err: 'Video can not be deleted'
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})

//like api
Router.put('/like/:videoId', checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const video = await Video.findById(req.params.videoId)
        console.log(video);
        if (video.likedBy.includes(verifiedUser._id)) {
            return res.status(500).json({
                err:'already liked'
            })
        }

        if (video.dislikedBy.includes(verifiedUser._id)){
            video.dislike -=1
            video.dislikedBy = video.dislikedBy.filter(userId => userId.toString != verifiedUser._id)
        }
        video.likes += 1;
        video.likedBy.push(verifiedUser._id)
        await video.save({validateBeforeSave: false})
        res.status(200).json({
            msg: 'liked'
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})


//dislike api
Router.put('/dislike/:videoId', checkAuth, async(req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization?.split(" ")[1],  'mukesh kumar 2725')
        console.log(verifiedUser);
        const video = await Video.findById(req.params.videoId)
        console.log(video);
        if (video.dislikedBy.includes(verifiedUser._id)) {
            return res.status(500).json({
                err:'already disliked'
            })
        }

        if (video.likedBy.includes(verifiedUser._id)){
            video.likes -=1
            video.likedBy = video.likedBy.filter(userId => userId.toString != verifiedUser._id)
        }

        video.dislike+=1;
        video.dislikedBy.push(verifiedUser._id)
        await video.save({validateBeforeSave: false})
        res.status(200).json({
            msg: 'disliked'
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})


// view api
Router.put('/views/:videoId', async(req, res) => {
    try {
        const video = await Video.findById(req.params.videoId)
        console.log(video);
        video.views += 1;
        await video.save()
        res.status(200).json({
            msg: 'ok'
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            err: error
        })
    }
})



module.exports = Router 
import { Router } from "express";
import RepositoryController from "../controllers/repository.controller.js";

const router = Router()



// Create a repository in database
router.post("/create", RepositoryController.create)
// Upload a repository to supabase
router.post("/upload-cloud", RepositoryController.uploadCloud)
// Get download link of a repository
router.get("/download", RepositoryController.download)
// Like a repository
router.put("/like", RepositoryController.like)
// Deleted a repository
router.delete("/", RepositoryController.delete)
// Get from an user
router.get("/", RepositoryController.getFromUser)
// Search repositories by name
router.get("/search", RepositoryController.search)
// Change name of repository
router.put("/change-name", RepositoryController.changeName)
// Change description of repository
router.put("/change-description", RepositoryController.changeDescription)
// Get full information of repository
router.get("/info", RepositoryController.getInfo)

export default router

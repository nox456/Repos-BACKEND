import db from "../connections/database.js";
import { SUPABASE_IMAGE_BUCKET } from "../config/env.js"
import supabase from "../connections/supabase.js"
import { extname } from "path"
import { z } from "zod"
import { PROFILE_INFO, SEARCH_USERS, USER_FOLLOWERS } from "./queries.js"

// Class used in 'user.service.js' that contains queries to database
export default class User {
    // Create a user in database with username and password
    static async save(data) {
        const { username, password } = data;
        let user;
        try {
            const user_response = await db.query(
                "INSERT INTO users VALUES (DEFAULT,$1,$2,DEFAULT,DEFAULT,DEFAULT,DEFAULT,DEFAULT) RETURNING *",
                [username, password]
            );
            user = user_response.rows[0];
        } catch (e) {
            console.error(e);
        }
        return user;
    }
    // Get a user by username field
    static async getByUsername(username) {
        let user
        try {
            const user_response = await db.query("SELECT * FROM users WHERE username = $1", [username])
            user = user_response.rows[0]
        } catch (e) {
            console.error(e)
        }
        return user
    }
    // Get a user by id field
    static async getById(id) {
        let user
        try {
            const user_response = await db.query("SELECT * FROM users WHERE id = $1", [id])
            user = user_response.rows[0]
        } catch (e) {
            console.error(e)
        }
        return user
    }
    // Delete a user by id field
    static async delete(id) {
        try {
            await db.query("DELETE FROM users WHERE id = $1", [id])
        } catch (e) {
            console.error(e)
        }
    }
    // Check if a user exists by id field
    static async checkIfExistsById(id) {
        let usersExists
        try {
            const user_response = await db.query("SELECT id FROM users WHERE id = $1", [id])
            usersExists = user_response.rows.length > 0
        } catch (e) {
            console.error(e)
        }
        return usersExists
    }
    // Check if a user exists by username field
    static async checkIfExistsByUsername(username) {
        let usersExists
        try {
            const user_response = await db.query("SELECT username FROM users WHERE username = $1", [username])
            usersExists = user_response.rows.length > 0
        } catch (e) {
            console.error(e)
        }
        return usersExists
    }
    // Update username field by id field
    static async changeUsername(newUsername, id) {
        try {
            await db.query("UPDATE users SET username = $1 WHERE id = $2", [newUsername, id])
        } catch (e) {
            console.error(e)
        }
    }
    // Update password field by id field
    static async changePassword(newPassword, id) {
        try {
            await db.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, id])
        } catch (e) {
            console.error(e)
        }
    }
    // Update description field by id field
    static async changeDescription(newDescription, id) {
        try {
            await db.query("UPDATE users SET description = $1 WHERE id = $2", [newDescription, id])
        } catch (e) {
            console.error(e)
        }
    }
    // Update image field by id field
    static async changeImage(image, id) {
        const ext = extname(image.originalname)
        let imageUrl
        try {
            const imageUploaded = await supabase.storage.from(SUPABASE_IMAGE_BUCKET).upload(`users-images/${id}${ext}`, image.buffer)
            imageUrl = supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(imageUploaded.data.path)
            await db.query("UPDATE users SET img = $1 WHERE id = $2", [imageUrl.data.publicUrl, id])
        } catch (e) {
            console.error(e)
        }
        return imageUrl.data.publicUrl
    }
    // Add a user id in followers field of another user
    static async addFollowedUser(userFollowedId, userFollowerId) {
        let userFollowed
        try {
            const users_followed_response = await db.query("SELECT followed FROM users WHERE id = $1", [userFollowerId])
            const users_followed = users_followed_response.rows[0].followed
            users_followed.push(userFollowedId)
            userFollowed = await db.query("UPDATE users SET followed = $1 WHERE id = $2 RETURNING *", [users_followed, userFollowerId])
        } catch (e) {
            console.error(e)
        }
        return userFollowed.rows[0]
    }
    // Add a user id in followed field of another user
    static async addFollowerUser(userFollowerId, userFollowedId) {
        try {
            const user_followers_response = await db.query("SELECT followers FROM users WHERE id = $1", [userFollowedId])
            const user_followers = user_followers_response.rows[0].followers
            user_followers.push(userFollowerId)
            await db.query("UPDATE users SET followers = $1 WHERE id = $2 RETURNING *", [user_followers, userFollowedId])
        } catch (e) {
            console.error(e)
        }
    }
    // Validate input of id field
    static async validateId(id) {
        const schema = z
            .string({ invalid_type_error: "ID must be a string!", required_error: "ID required!" })
            .uuid({ message: "ID must be a UUID" })
        const validation = await schema.safeParseAsync(id)
        if (!validation.success) {
            return {
                validationError: validation.error.issues[0].message,
                validationField: id
            }
        }
    }
    // Validate input of username field
    static async validateUsername(username) {
        const schema = z
            .string({ invalid_type_error: "Username must be a string!", required_error: "Username required!" })
            .min(3, { message: "Username must be 3 or more characters" })
            .max(15, { message: "Username must be less than 15 characters" })
        const validation = await schema.safeParseAsync(username)
        if (!validation.success) {
            return {
                validationError: validation.error.issues[0].message,
                validationField: username
            }
        }
    }
    // Validate input of password field
    static async validatePassword(password) {
        const schema = z
            .string({ invalid_type_error: "Password must be a string!", required_error: "Password required!" })
            .min(1, { message: "Password required!" })
        const validation = await schema.safeParseAsync(password)
        if (!validation.success) {
            return {
                validationError: validation.error.issues[0].message,
                validationField: password
            }
        }
    }
    // Validate input of description field
    static async validateDescription(description) {
        const schema = z
            .string({ invalid_type_error: "Description must be a string!", required_error: "Description required!" })
            .max(150, { message: "Description must be less than 150 characters" })
        const validation = await schema.safeParseAsync(description)
        if (!validation.success) {
            return {
                validationError: validation.error.issues[0].message,
                validationField: description
            }
        }
    }
    // Validate input of image field
    static async validateImage(image) {
        const schema = z.string({ invalid_type_error: "Image must be a string!", required_error: "Image required!" })
        const validation = await schema.safeParseAsync(image)
        if (!validation.success) {
            return {
                validationError: validation.error.issues[0].message,
                validationField: image
            }
        }
    }
    // Get users by username field
    static async search(username) {
        let usersFounded
        try {
            const users_response = await db.query(SEARCH_USERS, [`%${username}%`])
            usersFounded = users_response.rows
        } catch (e) {
            console.error(e)
        }
        return usersFounded
    }
    // Get followers field of a user by id field
    static async getFollowers(user_id, username) {
        let followers
        try {
            const users_response = await db.query(USER_FOLLOWERS, [user_id])
            if (username) {
                followers = users_response.rows[0].followers.filter((follower) => {
                    return follower.username.toLowerCase().includes(username.toLowerCase())
                }
                )
            } else {
                followers = users_response.rows[0].followers
            }
        } catch (e) {
            console.error(e)
        }
        if (!followers[0].username) return []

        return followers
    }
    // Get profile info of a user by id
    static async getProfileInfo(user_id) {
        let profileInfo
        try {
            const profile_response = await db.query(PROFILE_INFO,[user_id])
            profileInfo = profile_response.rows[0]
        } catch(e) {
            console.error(e)
        }
        return profileInfo
    }
}

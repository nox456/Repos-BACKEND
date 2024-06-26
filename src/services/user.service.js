import User from "../models/user.model.js"
import Auth from "../models/auth.model.js"

// Class used in 'user.controller.js' that contains validations and user model queries
export default class UserService {
    // Delete a user by id and password
    static async deleteUser(id, password) {
        const id_validation_error = await User.validateId(id)
        if (id_validation_error) return id_validation_error

        const password_validation_error = await User.validatePassword(password)
        if (password_validation_error) return password_validation_error

        const userExists = await User.checkIfExistsById(id)

        if (!userExists) return { userNotExists: true }

        const storedUser = await User.getById(id)

        const storedPassword = storedUser.password

        const matchPassword = await Auth.comparePassword(password, storedPassword)

        if (!matchPassword) return { passwordNotMatch: true }

        await User.delete(id)
    }
    // Change username field of a user by id and password
    static async changeUsername(newUsername, id, password) {
        const username_validation_error = await User.validateUsername(newUsername)
        if (username_validation_error) return username_validation_error

        const id_validation_error = await User.validateId(id)
        if (id_validation_error) return id_validation_error

        const password_validation_error = await User.validatePassword(password)
        if (password_validation_error) return password_validation_error

        const userExists = await User.checkIfExistsById(id)

        if (!userExists) return { userNotExists: true }

        const user = await User.getById(id)

        const matchPassword = await Auth.comparePassword(password, user.password)

        if (!matchPassword) return { passwordNotMatch: true }

        await User.changeUsername(newUsername, id)
    }
    // Change password field of a user by id and password
    static async changePassword(newPassword, id, password) {
        const newPassword_validation_error = await User.validatePassword(newPassword)
        if (newPassword_validation_error) return newPassword_validation_error

        const id_validation_error = await User.validateId(id)
        if (id_validation_error) return id_validation_error

        const password_validation_error = await User.validatePassword(password)
        if (password_validation_error) return password_validation_error

        const userExists = await User.checkIfExistsById(id)

        if (!userExists) return { userNotExists: true }

        const user = await User.getById(id)

        const matchPassword = await Auth.comparePassword(password, user.password)

        if (!matchPassword) return { passwordNotMatch: true }

        const encryptedPassword = await Auth.encryptPassword(newPassword)

        await User.changePassword(encryptedPassword, id)
    }
    // Change description field of a user by id
    static async changeDescription(newDescription, id) {

        const id_validation_error = await User.validateId(id)
        if (id_validation_error) return id_validation_error

        const description_validation_error = await User.validateDescription(newDescription)
        if (description_validation_error) return description_validation_error

        const userExists = await User.checkIfExistsById(id)

        if (!userExists) return { userNotExists: true }

        await User.changeDescription(newDescription, id)
    }
    // Change image field of a user by id
    static async changeImage(image, id) {
        const id_validation_error = await User.validateId(id)
        if (id_validation_error) return id_validation_error

        const image_validation_error = await User.validateImage(image)
        if (image_validation_error) return image_validation_error

        const userExists = await User.checkIfExistsById(id)

        if (!userExists) return { userNotExists: true }

        const imageUrl = await User.changeImage(image, id)
        return { imageUrl }
    }
    // Follow a user by id field
    static async followUser(userFollowedId, userFollowerId) {
        const userFollowerId_validation_error = await User.validateId(userFollowerId)
        if (userFollowerId_validation_error) return userFollowerId_validation_error

        const userFollowedId_validation_error = await User.validateId(userFollowedId)
        if (userFollowedId_validation_error) return userFollowedId_validation_error

        const userExists = await User.checkIfExistsById(userFollowerId)

        if (!userExists) return { userNotExists: true }

        const userFollowed = await User.addFollowedUser(userFollowedId, userFollowerId)
        await User.addFollowerUser(userFollowerId, userFollowedId)

        return { userFollowed }
    }
    // Get users by username field
    static async search(username) {
        const username_validation_error = await User.validateUsername(username)
        if (username_validation_error) return username_validation_error

        const users = await User.search(username)
        return users
    }
    // Get followers of a user by username
    static async getFollowers(user_id,username) {
        const id_validation_error = await User.validateId(user_id)
        if (id_validation_error) return id_validation_error

        if (username) {
            const username_validation_error = await User.validateUsername(username)
            if (username_validation_error) return username_validation_error
        }

        const userExists = await User.checkIfExistsById(user_id)
        if (!userExists) return { userNotExists: true }

        const followers = await User.getFollowers(user_id,username)
        return followers
    }
    // Get profile info a user by id
    static async getProfileInfo(user_id) {
        const id_validation_error = await User.validateId(user_id)
        if (id_validation_error) return id_validation_error

        const userExists = await User.checkIfExistsById(user_id)
        if (!userExists) return { userNotExists: true }
        
        const profileInfo = await User.getProfileInfo(user_id)
        return profileInfo
    }
}

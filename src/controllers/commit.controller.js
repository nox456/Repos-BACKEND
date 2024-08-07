import errorCodes from "../lib/constants/errorCodes.js";
import { INTERNAL_SERVER_ERROR } from "../lib/constants/errors.js";
import ResponseHandler from "../lib/responseHandler.js";
import CommitService from "../services/commit.service.js";

/**
 * Controller to handle commits requests
 * */
export default class CommitController {
    /**
     * Get all commits from a repository
     * */
    static async getAll(req, res) {
        const { repoName } = req.query;
        const { token } = req.cookies;
        let result;
        try {
            result = await CommitService.getAll(repoName, token);
        } catch (e) {
            return ResponseHandler.error(
                errorCodes[INTERNAL_SERVER_ERROR],
                "Internal Server Error!",
                res,
            );
        }
        if (!result.success) {
            return ResponseHandler.error(
                errorCodes[result.error.type],
                result.error.message,
                res,
            );
        } else {
            return ResponseHandler.ok("Commits Founded!", result.data, res);
        }
    }
    /**
     * Get full information of commit by hash
     * */
    static async getInfo(req,res) {
        const {hash} = req.query
        let result
        try {
            result = await CommitService.getInfo(hash)
        } catch(e) {
            console.error(e)
            return ResponseHandler.error(errorCodes[INTERNAL_SERVER_ERROR], "Internal Server Error!",res)
        }
        if (!result.success) {
            return ResponseHandler.error(errorCodes[result.error.type], result.error.message, res)
        } else {
            return ResponseHandler.ok("Commit Info!",result.data, res)
        }
    }
}

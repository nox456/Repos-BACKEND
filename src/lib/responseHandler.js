// Send response with ok status code, data and message
export default class ResponseHandler {
    static ok(message, data, res) {
        return res.status(200).json({ message, data })
    }
}

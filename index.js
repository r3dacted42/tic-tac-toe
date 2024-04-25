import Pusher from "pusher";
import express, { json, urlencoded } from 'express';
import cors from "cors";

const app = express();
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors());

app.use(express.static('public'));

const pusher = new Pusher({
    appId: "1793495",
    key: "338268c30f0c785cfd2f",
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    useTLS: true
});

var totalNumOfUsers = 0;

app.post("/pusher/user-auth", (req, res) => {
    const socketId = req.body.socket_id;
    const user = {
        id: `ttt_${Date.now()}`,
        user_info: {
            name: req.body.playername,
        },
    };
    const authResponse = pusher.authenticateUser(socketId, user);
    totalNumOfUsers++;
    res.send(authResponse);
});

const port = process.env.PORT || 5000;
console.log('listening on port ' + port);
app.listen(port);

export default app;
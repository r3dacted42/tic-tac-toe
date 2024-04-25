import Pusher from "pusher";
import express, { json, urlencoded } from 'express';
import cors from "cors";

const app = express();
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors());

const pusher = new Pusher({
    appId: "1793495",
    key: "338268c30f0c785cfd2f",
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    useTLS: true
});

var totalNumOfUsers = 0;

app.get('/*', function (req, res) {
    const options = {
        root: process.cwd()
    };

    var fileName = req.params['0'] || 'index.html';
    console.log(fileName);

    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.error('Error sending file:', err);
        } else {
            console.log('Sent:', fileName);
        }
    });
});

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

# tic-tac-toe
tic-tac-toe game using phaser and pusher

## architecture
- backend runs on express
- pusher used by server for matchmaking and clients for intercommunication
- clients make rest calls to server for game events
- server maintains the game state and verifies moves before modifying the state

## flow
- pusher authentication and room assignment
    - client sends user's chosen name to authentication endpoint
    - server returns the assigned user-id and room-id for the client
    - server also sends the user-id, and user-info (name, room-id) of the new user to pusher
    - server stores the newly created room's status as waiting, with a member count of 0
    - client joins the lobby channel and subscribes to the count change event to keep track of the number of users waiting to play
    - on success, the client loads the `Lobby` scene and presents the room-id, a text box to enter an existing room-id, and a button to join a random existing room
- pusher authorization and room joining
    - client sends the user-id and room-id (which when prefixed with 'presence-' becomes the channel name) to the authorization endpoint
    - server verifies if the room exists and is valid, and then queries pusher to get the number of users in that room
    - if the number of users is less than 2, the user is provided entry into the room and the room is marked as ready when the user-count reaches 2
    - when the room is ready, the server stores the user-id of the player who will make the first move, the first move type (X), the scores (0, 0), and the board state (empty)
    - if a user tries to join a room that already has 2 players, they are notified that the room is full
    - when the room is ready (2 users have joined), the client leaves the lobby channel and loads the `Play` scene
    - when the endpoint for joining a random room is called, the server finds the first room that has 1 user and returns the room id. if no such rooms exist, the user's room is marked as random and a searching message is displayed
    - the users are also able to communicate through text messages that can be sent through a text box at the bottom left
- game initiation
    - clients query the server at the room-status endpoint to receive the initial state of the game
    - clients set up the board and the player who's marked as the first player is displayed the possible moves they can make (a bunch of X's accross the board)
- game flow
    - on selection of a move by the user, it is sent to the server at the make-move endpoint and is verified to be valid
    - on validation, the client receives the updated state of the game and sends the result to the other user in the room through pusher
    - both clients update the views and the next user is displayed the possible moves
    - this goes on until there's a winner or a tie, with the server validating each step and deciding the outcome
    - when the match ends, the result is displayed on the clients and a timer of 10 seconds is started
- game reset
    - when the timer ends, both the clients make a request to the reset-game endpoint
    - client whose request reaches first is responded that the reset has been initiated
    - the server sets the room status as resetting and resets the game state, with the losing player getting the first move
    - on arrival of the second client's request, the room is marked as ready and the new state of the game is sent back
    - client who received the state then forwards it to the other client in the room and both reset the board
    - the game begins again with the losing user's client displaying the possible moves
    - this keeps on going until the users reload the page
    - if a user leaves mid-match, the user who is still in the room is notified and the page reloads in 10 seconds (not implemented yet)

## api endpoints
- /api/auth (pusher authentication)
- /api/auth-chan (pusher authorization)
- /api/room-status
- /api/join-random
- /api/make-move
- /api/reset-game

## thanks
phaser, pusher, vercel, the community  
peace ☮ 

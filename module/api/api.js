const ip = require('ip');
const mysql = require('mysql');
// Standard MD5 hashing algorithm
const md5 = require('./../md5/md5.js');
// Standard FIPS 202 SHA-3 implementation
const { SHA3 } = require('sha3');
// The Keccak hash function is also available
const { Keccak } = require('sha3');

// Generate timestamp: if full argument is false/undefined,
// timestamp is divided by 1000 to generate linux-length timestamp
function timestamp(full) {
    let date = new Date();
    let timestamp = date.getTime();
    return full ? Math.floor(timestamp) : Math.floor(timestamp / 1000);
}

// Generate string "1s", "2h", etc between now and "time" argument
function elapsed(time) {
    const $SECONDS = Math.abs(timestamp() - time);
    const $iv_table = ["s", "min", "h", "d", "mo", "y", "s", "min", "h", "d", "mo", "y"];
    const $iv = [$SECONDS,
        ($SECONDS - ($SECONDS % 60)) / 60,
        ($SECONDS - ($SECONDS % 3600)) / 3600,
        ($SECONDS - ($SECONDS % (3600 * 24))) / (3600 * 24),
        ($SECONDS - ($SECONDS % (3600 * 24 * 30))) / (3600 * 24 * 30),
        ($SECONDS - ($SECONDS % (3600 * 24 * 30 * 12))) / (3600 * 24 * 30 * 12)
    ];
    for (let $i = 5; $i >= 0; $i--) {
        $r = $iv[$i];
        if ($r > 0) {
            if (($r > 1 || $r == 0))
                $i += 6;
            return $r + "" + $iv_table[$i];
        }
    }
}

// Check if  property with value exists on an object
Object.prototype.exists = function(property_name, value) {
    for (let i = 0; i < this.length; i++) {
        let o = this[i];
        if (o[property_name] != undefined)
            if (o[property_name] == value)
                return true;
    }
    return false;
}

// Check if value exists in array
Array.prototype.exists = function(value) {
    for (let i = 0; i < this.length; i++)
        if (this[i] == value)
            return true;
    return false;
}

class database {
    constructor() {}
    static create() {
        let message = "Creating MySQL connection...";
        this.connection = mysql.createConnection({
            host: 'XX.XX.XX.XXX', // or localhost
            user: 'root',
            password: 'PassWord123!',
            database: 'databasename'
        });
        this.connection.connect();
        console.log(message + "Ok.");
    }
}

/* //Requires payload.email_address = <email_address>
function action_register_user(request, payload) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        let q = `SELECT email_address FROM user WHERE email_address = '${payload.email_address}' LIMIT 1`;
        database.connection.query(q,
            (error, results) => { // Check if user already exists in database
                if (error)
                    throw (error);
                let result = results[0];
                if (results && results.length != 0 && result.email_address == payload.email_address)
                    resolve(`{"success": false, "message": "user already exists"}`);
                else {
                    let avatar = JSON.stringify({ "head": 1, "eyes": 1 });
                    // Encrypt payload.password with md5 algorithm
                    let password_md5 = md5(payload.password);
                    let fields = "( `username`, `email_address`, `password_md5`, `first_name`, `last_name`, `avatar` )";
                    let values = `VALUES( '${payload.username}', '${payload.email_address}', '${password_md5}', 'first', 'last', '${avatar}')`;
                    database.connection.query("INSERT INTO user " + fields + " " + values,
                        (error, results) => { // Create new user in database
                            if (error)
                                throw (error);
                            resolve(`{"success": true, "message": "user registered"}`);
                        });
                }
            });
    }).catch((error) => { console.log(error) });
} */

/**
 * 
 * copy of the action_register_user function using async/await
 * 
 * Edited by: Robert Luisi
 * github: github.com/bobbylite
 * 
 **/
async function action_register_user(request, payload) {
    if (!request || !request.headers || !payload)
        throw "Error: Wrong request, missing request headers, or missing payload";

    let q = `SELECT email_address FROM user WHERE email_address = '${payload.email_address}' LIMIT 1`;

    database.connection.query(q,
        (error, results) => { // Check if user already exists in database
            if (error) throw (error);

            let result = results[0];

            if (results && results.length != 0 && result.email_address == payload.email_address) {
                return `{"success": false, "message": "user already exists"}`;
            }

            let avatar = JSON.stringify({ "head": 1, "eyes": 1 });
            // Encrypt payload.password with md5 algorithm
            let password_md5 = md5(payload.password);
            let fields = "( `username`, `email_address`, `password_md5`, `first_name`, `last_name`, `avatar` )";
            let values = `VALUES( '${payload.username}', '${payload.email_address}', '${password_md5}', 'first', 'last', '${avatar}')`;

            database.connection.query("INSERT INTO user " + fields + " " + values,
                (error) => { // Create new user in database
                    if (error) throw (error);
                    return `{"success": true, "message": "user registered"}`;
                });
        });
}

// Requires payload.id = <Numeric User ID>
function action_get_user(request, payload) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM user WHERE id = '" + payload.id + "' LIMIT 1",
            (error, results) => { // Check if user already exists in database
                if (error) throw (error);
                let result = results[0];
                if (results && results.length != 0 && result.id == payload.id) {
                    result.found = true;
                    resolve(`{"found": true, "user": ${JSON.stringify(result)}, "message": "user found"}`);
                } else
                    resolve(`{"found": false, "user": null, "message": "user with this id doesn't exist"}`);
            });
    }).catch(error => console.log(error));
}

function action_get_user_promiseless(request, payload) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM user WHERE id = '" + payload.id + "' LIMIT 1",
            (error, results) => { // Check if user already exists in database
                if (error) throw (error);
                let result = results[0];
                if (results && results.length != 0 && result.id == payload.id) {
                    resolve(`{"found": true, "user": ${JSON.stringify(result)}, "message": "user found"}`);
                } else
                    resolve(`{"found": false, "user": null, "message": "user with this id doesn't exist"}`);
            });
    }).catch(error => console.log(error));
}

function action_delete_user(request, payload) {
    return new Promise((resolve, reject) => {
        // Header or payload are missing
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        // Payload must specify user id
        if (!payload.id)
            reject("User id not specified!");
        let query = "DELETE from `user` WHERE `id` = " + payload.id;
        database.connection.query(query, (error, results) => {
            if (error)
                throw (error);
            let result = results[0];
            console.log("results[0] = ", results[0]);
            console.log("result = ", result);
            resolve(`{"success": true, "message": "user updated!"}`);
        });
    }).catch(error => console.log(error));
}

function action_update_user(request, payload) {
    return new Promise((resolve, reject) => {
        // Header or payload are missing
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        // Payload must specify user id
        if (!payload.id)
            reject("User id not specified!");
        // Columns allowed to be changed:
        let allowed = ["id", "email_address", "password_md5"];
        // Exclude not-allowed fields from payload
        Object.entries(payload).map((value, index, obj) => {
            let name = value[0];
            if (!allowed.exists(name)) delete payload[name];
        });
        // Start MySQL query
        let query = "UPDATE user SET ";
        // Build the rest of MySQL query from payload
        Object.entries(payload).map((item, index, object) => {
            let name = item[0];
            let value = payload[name];
            index != 0 ? query += ", " : null;
            query += "`" + name + "` = '" + value + "'";
        });
        // End query
        query += " WHERE `id` = '" + payload.id + "'";
        // Execute MySQL query we just created
        database.connection.query(query, (error, results) => {
            if (error)
                throw (error);
            let result = results[0];
            console.log("results[0] = ", results[0]);
            console.log("result = ", result);
            resolve(`{"success": true, "message": "user updated!"}`);
        });

    }).catch(error => null);
}

function action_login(request, payload) {
    return new Promise((resolve, reject) => {
        // First, get the user from database by payload.id
        let query = `SELECT * FROM \`user\` WHERE \`username\` = '${payload.username}'`;
        console.log(query);
        database.connection.query(query,
            (error, results) => { // Check if user already exists in database
                if (error)
                    throw (error);
                let result = results[0];
                /* console.log("result = ", result);
                console.log("payload.username = ", payload.username);
                console.log("payload.password = ", payload.password);
                console.log("password 1 = ", md5(payload.password));
                console.log("password 2 = ", result.password_md5); */
                if (results && results.length != 0 && result.username == payload.username) {
                    // result.found = true;
                    // Check if submitted password is correct
                    if (md5(payload.password) == result.password_md5) {
                        delete result.email_address; // don't send email to front-end
                        delete result.password_md5; // don't send md5 password to front-end
                        resolve(`{"success": true, "user": ${JSON.stringify(result)}, "message": "user successfully logged in!"}`);
                    } else
                        resolve(`{"success": false, "user": null, "message": "incorrect username or password"}`);
                }
                // User not found
                resolve(`{"success": false, "user": null, "message": "user with this username(${payload.username}) doesn't exist"}`);
            });
    }).catch(error => console.log(error));
}

function action_logout(request, payload) {
    return new Promise((resolve, reject) => {
        /* implement */
    }).catch(error => console.log(error));;
}

function action_create_session(request, payload) {
    // Create unique authentication token
    function create_auth_token() {
        let token = md5(timestamp(true) + "");
        return token;
    }
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE user_id = '" + payload.id + "' LIMIT 1",
            (error, results) => { // Check if session already exists
                if (error) throw (error);
                let result = results[0];
                if (results && results.length != 0 && result.user_id == payload.id) {
                    result.found = true;
                    resolve(`{"found": true,
                          "token": token,
                          "session": ${JSON.stringify(result)},
                          "message": "session already exists"}`);
                } else { // This session doesn't exist, create it
                    // Create auth token
                    let token = create_auth_token();
                    database.connection.query("INSERT INTO session ( `user_id`, `timestamp`, `token`) VALUES( '" + payload.id + "', '" + timestamp() + "', '" + token + "')",
                        (error, results) => {
                            if (error) throw (error);
                            resolve(`{"found" : false,
                                  "token" : token,
                                  "user_id": ${payload.user_id},
                                  "message": "session was created"}`);
                        });
                }
            });
    }).catch(error => { console.log(error) });
}

function action_get_session(request, payload) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE user_id = '" + payload.id + "' LIMIT 1",
            (error, results) => { // Return session
                if (error)
                    throw (error);
                let result = results[0];
                if (results && results.length != 0 && result.user_id == payload.id) {
                    result.found = true;
                    resolve(`{"found": true,
                          "session": ${JSON.stringify(result)},
                          "message": "session found"}`);
                } else
                    resolve(`{"found": false, "session": null, "message": "session found"}`);
            });
    }).catch((error) => { console.log(error) });
}

function action_authenticate_user(request, payload) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE token = '" + payload.token + "' LIMIT 1",
            (error, results) => { // Return session
                if (error)
                    throw (error);
                if (results.length == 0) {
                    console.log("API.authenticate, results.length == 0 (session with token not found)");
                    reject(`{"success": false, "message": "token not found in session"}`);
                } else {
                    //console.log( results );
                    //console.log( results[0] );
                    let token = JSON.stringify({ token: results[0].token, type: "admin" });
                    resolve(`{"success": true, "message": "user (id=${results[0].user_id}) was successfully authenticated", "token" : ${token}}`);
                }
            });
    }).catch((error) => { console.log(error) });
}

// Check if API.parts match a URL pattern, example: "api/user/get"
function identify(a, b) {
    return API.parts[0] == "api" && API.parts[1] == a && API.parts[2] == b;
}

// General use respond function -- send json object back to the browser in response to a request
function respond(response, content) {
    console.log("responding = ", [content]);
    const jsontype = "{ 'Content-Type': 'application/json' }";
    response.writeHead(200, jsontype);
    response.end(content, 'utf-8');
}

// Convert buffer to JSON object
function json(chunks) {
    return JSON.parse(Buffer.concat(chunks).toString());
}

class Action {}

Action.register_user = action_register_user;
Action.login = action_login;
Action.logout = action_logout;
Action.get_user = action_get_user;
Action.delete_user = action_delete_user;
Action.update_user = action_update_user;
Action.authenticate_user = action_authenticate_user;
Action.create_session = action_create_session;
Action.get_session = action_get_session;

const resp = response => content => respond(response, content);

class API {

    constructor() {}

    async exec(request, response) {

        console.log("API.exec(), parts = ", API.parts);

        if (request.method == 'POST') {

            request.url[0] == "/" ? request.url = request.url.substring(1, request.url.length) : null;
            request.parts = request.url.split("/");
            request.chunks = [];

            // Start reading POST data chunks
            request.on('data', segment => {
                if (segment.length > 1e6) // 413 = "Request Entity Too Large"
                    response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                else
                    request.chunks.push(segment);
            });

            // Finish reading POST data chunks
            request.on('end', () => { // POST data fully received

                API.parts = request.parts;

                if (identify("user", "register")) { // Register (create) user
                    let content = await Action.register_user(request, json(request.chunks))
                    respond(response, content);
                }

                if (identify("user", "login")) // Log in
                    Action.login(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("user", "logout")) // Log out
                    Action.logout(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("user", "delete")) // Delete user
                    Action.delete_user(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("user", "get")) // Get user data
                    Action.get_user(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("user", "update")) // Update user
                    Action.update_user(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("session", "create")) // Create session
                    Action.create_session(request, json(request.chunks))
                    .then(content => respond(response, content));

                if (identify("user", "authenticate")) // Authenticate user
                    Action.authenticate_user(request, json(request.chunks))
                    .then(content => respond(response, content));
            });
        }
    }
    static catchAPIrequest(request) {
        request[0] == "/" ? request = request.substring(1, request.length) : null;
        if (request.constructor === String)
            if (request.split("/")[0] == "api") {
                API.parts = request.split("/");
                return true;
            }
        return false;
    }
}

API.parts = null;

module.exports = { API, database };
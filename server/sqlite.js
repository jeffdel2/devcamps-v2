import { existsSync } from 'fs';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';

const dbFile = './db/customer.db';
const exists = existsSync(dbFile);

let db;

/* 
Using the sqlite wrapper so that we can make async / await connections
*/
sqlite
    .open({
        filename: dbFile,
        driver: sqlite3.Database
    })
    .then(async dBase => {
        db = dBase;
        try {
            // The async / await syntax lets us write the db operations in a way that won't block the app
            if (!exists) {
                // Database doesn't exist yet - create CustomerData and Log tables
                await db.run(
                    "CREATE TABLE customerdata (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, auth0_user_id TEXT, crm_user_id INTEGER, order_no TEXT, purchase_item TEXT)"
                );

                //Add default user data to table
                //await db.run(
                //    "INSERT INTO customerdata (auth0_user_id, crm_user_id) VALUES (NULL, RANDOM())"
                //);

                // Log can start empty and we'll just insert a new record whenever a user is created/modified
                await db.run(
                    "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, auth0_user_id TEXT, crm_user_id INTEGER, order_no TEXT, purchase_item TEXT)"
                );
                console.log("FIRST WRITE", await db.all("SELECT * from customerdata"));
            } else {
                // We have a database already - write Choices records to log for info
                console.log("READ", await db.all("SELECT * from customerdata"));

                //If you need to remove a table from the database use this syntax
                //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
            }
        } catch (dbError) {
            console.error(dbError);
        }
    });


/**
 * Get the options in the database
 *
 * Return everything in the CustomerData table
 * Throw an error in case of db connection issues
 */
export const getOptions = async () => {
    // We use a try catch block in case of db errors
    try {
        return await db.all("SELECT * from CustomerData");
    } catch (dbError) {
        console.error(dbError);
        throw new Error("Failed to fetch customer data");
    }
};

/**
 * Process a new user
 *
 * Receive the user create call from server
 * Add a log entry
 */

let userEmail;

export const processCreate = async create => {
    // Insert new User into the CRM table
    try {
        console.log("HANDOFF", userEmail);
        await db.run(
            "INSERT INTO customerdata (auth0_user_id, crm_user_id) VALUES (NULL, ABS(RANDOM() % 300))"
        );

        // Return the crm id we just created
        //return await db.all("SELECT * from CustomerData");
        return await db.all("SELECT crm_user_id from customerdata ORDER by ID DESC LIMIT 1");
    } catch (dbError) {
        console.error(dbError);
    }
};


/**
 * Get logs
 *
 * Return choice and time fields from all records in the Log table
 */
export const getLogs = async () => {
    // Return most recent 20
    try {
        // Return the array of log entries to admin page
        return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
        console.error(dbError);
    }
};

/**
 * Clear logs and reset votes
 *
 * Destroy everything in Log table
 * Reset votes in Choices table to zero
 */
export const clearHistory = async () => {
    try {
        // Delete the logs
        await db.run("DELETE from Log");

        // Reset the vote numbers
        await db.run("UPDATE CustomerData SET picks = 0");
        console.log("INSIDE");

        // Return empty array
        return [];
    } catch (dbError) {
        console.error("CORRECT ERROR", dbError);
    }
}
# Google Sheets and PostgreSQL Database Synchronization

## Overview

This project synchronizes a PostgreSQL database with Google Sheets, allowing for real-time data updates and management. It uses Google Apps Script to trigger events on Google Sheets, while leveraging Kafka and Debezium to monitor changes in the database.

## Features

- Real-time synchronization between Google Sheets and PostgreSQL.
- Automatic updates to the database when changes are made in Google Sheets.
- Two-way data synchronization to keep both systems in sync.
- Notifications for changes via integrated messaging solutions.

## Technologies Used

- **Google Apps Script**: To create triggers for Google Sheets edit events.
- **PostgreSQL**: As the backend database for storing data.
- **Apache Kafka**: To stream database changes effectively.
- **Debezium**: For monitoring changes in the PostgreSQL database.
- **Node.js**: Backend application handling API requests and data synchronization.

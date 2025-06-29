# How to Upload Image Fast and Securely to Cloud Storage (S3)

---

## AIM:

* Upload images to **Amazon S3** (or any other cloud storage) securely and quickly.
* Delete unused images if the user does not complete the form.

---

## Flow

### **Step 1: User Initiates Image Upload**

* When the user clicks **Upload Image**, a request is sent to the backend to:

  * Generate a **presigned URL**
  * Generate a unique **key** for the image (e.g., `uuid().jpg`)
  * Store this key, URL, and metadata in a DB table `UploadStatus` with `status = "pending"`

* The frontend uses the **presigned URL** and key to **upload directly to S3** (avoids routing through the backend = faster + lower server load).

> The presigned URL is valid for a short time (e.g., 5–15 mins), and is bound to a single file key and upload action.

---

### Why Not Upload via Backend?

* Uploading through the backend:

  * Increases **server load** and **memory usage**
  * Is **slower** due to data passthrough
* With presigned URLs:

  * Upload goes **directly from browser to S3**
  * Backend only signs, doesn't transport file

---

### **Step 2: After Upload — Two Cases**

---

### Case 1: User Completes the Form

* Form data is submitted to backend along with the image key or URL
* Backend:

  * Saves data in `Users` table (or related table)
  * Marks corresponding `UploadStatus.status = "completed"` (or deletes the entry)

---

### Case 2: User Abandons or Changes the Upload

#### 2.1: User Changes the Image

* Generate **new key + presigned URL**
* Upload new image
* Insert **new record** into `UploadStatus` table
* (Optional) delete the previous image from S3 immediately, or allow cron job to handle it

#### 2.2: User Abandons the Form

* The image remains in S3 as an **orphaned (unused) file**
* But it has a DB record with `status = "pending"`

---

## Cleanup Logic (Cron Job)

A daily cron job runs at a fixed interval (e.g., every night at 2 AM) and:

* Queries `UploadStatus` where:

  * `status = "pending"`
  * `createdAt < now() - 24 hours`

For each match:

1. Deletes the file from S3 using the stored `key`
2. Deletes (or marks) the record in the DB


> This ensures stale/abandoned uploads do not accumulate and eat storage.

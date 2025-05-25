
# FastAPI Integration Configuration for ICCT RFID System

## Database Structure
The Firebase Realtime Database should have the following structure:

```
icct-rfid-system/
├── students/
│   ├── TA202200470/
│   │   ├── name: "Juan Dela Cruz"
│   │   ├── rfid: "BD311B2A"
│   │   ├── email: "juan.delacruz@icct.edu.ph"
│   │   ├── course: "Computer Science"
│   │   ├── year: "3rd Year"
│   │   └── section: "A"
│   └── ...
├── scannedRFIDs/
│   ├── BD311B2A/
│   │   ├── id: "BD311B2A"
│   │   └── timestamp: 1671234567890
│   └── ...
├── attendanceRecords/
├── adminUsers/
├── schedules/
├── absenteeAlerts/
└── rfidQueue/
```

## FastAPI Endpoint Requirements

### 1. RFID Scan Endpoint
**POST** `/api/rfid/scan`

**Request Body:**
```json
{
  "rfid": "BD311B2A",
  "timestamp": 1671234567890
}
```

**Response:**
```json
{
  "status": "success",
  "message": "RFID scanned successfully",
  "data": {
    "rfid": "BD311B2A",
    "registered": true,
    "student": {
      "id": "TA202200470",
      "name": "Juan Dela Cruz"
    }
  }
}
```

### 2. Validation Rules
- RFID must be exactly 8 hexadecimal characters
- Timestamp must be a valid Unix timestamp
- Database writes should update the `scannedRFIDs` collection

### 3. Firebase Integration
```python
import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# Example FastAPI endpoint
@app.post("/api/rfid/scan")
async def scan_rfid(rfid_data: RFIDScanRequest):
    # Add to scannedRFIDs
    ref = db.reference('scannedRFIDs')
    ref.child(rfid_data.rfid).set({
        'id': rfid_data.rfid,
        'timestamp': rfid_data.timestamp
    })
    
    # Check if RFID is registered
    students_ref = db.reference('students')
    students = students_ref.get()
    
    registered_student = None
    for student_id, student_data in students.items():
        if student_data.get('rfid') == rfid_data.rfid:
            registered_student = {
                'id': student_id,
                'name': student_data.get('name')
            }
            break
    
    return {
        "status": "success",
        "message": "RFID scanned successfully",
        "data": {
            "rfid": rfid_data.rfid,
            "registered": registered_student is not None,
            "student": registered_student
        }
    }
```

## Security Considerations
1. Use Firebase service account authentication
2. Implement rate limiting on RFID scan endpoints
3. Validate RFID format before database operations
4. Log all scan attempts for audit purposes

## Frontend Integration
The React application polls the `scannedRFIDs` collection every 5 seconds to detect new scans and triggers the registration flow for unregistered RFIDs.

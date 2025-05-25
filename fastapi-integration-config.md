
# FastAPI Integration Configuration for ICCT RFID System

## Updated Database Structure
The Firebase Realtime Database now uses this structure with colon-separated RFID format:

```
icct-rfid-system/
├── ScannedIDs/
│   └── RFID: "32:65:C1:4C"  // Current scanned RFID
├── students/
│   ├── TA202200470/
│   │   ├── name: "Juan Dela Cruz"
│   │   ├── rfid: "BD:31:1B:2A"
│   │   ├── email: "juan.delacruz@icct.edu.ph"
│   │   ├── course: "Computer Science"
│   │   ├── year: "3rd Year"
│   │   └── section: "A"
│   └── ...
├── adminUsers/
├── attendanceRecords/
├── schedules/
└── absenteeAlerts/
```

## FastAPI Endpoint Requirements

### 1. RFID Scan Endpoint
**POST** `/api/rfid/scan`

**Request Body:**
```json
{
  "rfid": "32:65:C1:4C",
  "timestamp": 1671234567890
}
```

**Response:**
```json
{
  "status": "success",
  "message": "RFID scanned successfully",
  "data": {
    "rfid": "32:65:C1:4C",
    "registered": false,
    "student": null
  }
}
```

### 2. Updated Validation Rules
- RFID must be in format XX:XX:XX:XX (colon-separated hex pairs)
- Timestamp must be a valid Unix timestamp
- Database writes should update the `ScannedIDs/RFID` field

### 3. Firebase Integration
```python
import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# Updated FastAPI endpoint
@app.post("/api/rfid/scan")
async def scan_rfid(rfid_data: RFIDScanRequest):
    # Update ScannedIDs with new format
    ref = db.reference('ScannedIDs')
    ref.update({'RFID': rfid_data.rfid})
    
    # Check if RFID is registered
    students_ref = db.reference('students')
    students = students_ref.get()
    
    registered_student = None
    if students:
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

# Data model for validation
from pydantic import BaseModel, validator

class RFIDScanRequest(BaseModel):
    rfid: str
    timestamp: int
    
    @validator('rfid')
    def validate_rfid_format(cls, v):
        import re
        if not re.match(r'^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$', v):
            raise ValueError('RFID must be in format XX:XX:XX:XX')
        return v.upper()
```

## Automatic Registration Flow
1. FastAPI receives RFID scan and updates `ScannedIDs/RFID`
2. Frontend monitors `ScannedIDs/RFID` every 2 seconds
3. If scanned RFID not found in students database:
   - Automatically triggers admin login dialog
   - After successful admin login, navigates to student management
   - Opens registration dialog with pre-filled RFID
4. After successful registration, clears `ScannedIDs/RFID`

## Security Considerations
1. Use Firebase service account authentication
2. Implement rate limiting on RFID scan endpoints
3. Validate RFID format before database operations
4. Log all scan attempts for audit purposes
5. Clear `ScannedIDs/RFID` after processing to prevent replay attacks

## Testing
Use the RFIDSimulator component to test the automatic registration flow with test RFIDs like `32:65:C1:4C`.

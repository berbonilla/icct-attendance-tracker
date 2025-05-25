
export interface RFIDCard {
  id: string;
  timestamp: number;
  processed?: boolean;
}

export class RFIDService {
  private static instance: RFIDService;
  private listeners: ((rfidId: string) => void)[] = [];
  private knownRFIDs: Set<string> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): RFIDService {
    if (!RFIDService.instance) {
      RFIDService.instance = new RFIDService();
    }
    return RFIDService.instance;
  }

  async loadKnownRFIDs() {
    try {
      const dummyData = await import('../data/dummyData.json');
      const students = dummyData.students || {};
      
      this.knownRFIDs.clear();
      Object.values(students).forEach((student: any) => {
        if (student.rfid) {
          this.knownRFIDs.add(student.rfid);
        }
      });
      
      console.log('Loaded known RFIDs:', Array.from(this.knownRFIDs));
    } catch (error) {
      console.error('Error loading known RFIDs:', error);
    }
  }

  async checkForNewRFIDs() {
    try {
      const dummyData = await import('../data/dummyData.json');
      const rfidQueue = dummyData.rfidQueue || {};
      
      for (const [rfidId, data] of Object.entries(rfidQueue)) {
        const rfidData = data as RFIDCard;
        
        // Check if this RFID is unknown and unprocessed
        if (!this.knownRFIDs.has(rfidId) && !rfidData.processed) {
          console.log('Unknown RFID detected:', rfidId);
          this.notifyListeners(rfidId);
          
          // Mark as processed to avoid duplicate notifications
          rfidData.processed = true;
        }
      }
    } catch (error) {
      console.error('Error checking for new RFIDs:', error);
    }
  }

  startMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.loadKnownRFIDs();
    
    this.intervalId = setInterval(async () => {
      await this.checkForNewRFIDs();
    }, 5000);

    console.log('RFID monitoring started - checking every 5 seconds');
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('RFID monitoring stopped');
  }

  addListener(callback: (rfidId: string) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (rfidId: string) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(rfidId: string) {
    this.listeners.forEach(listener => listener(rfidId));
  }

  // Simulate RFID card detection for testing
  simulateRFIDDetection(rfidId: string) {
    console.log('Simulating RFID detection:', rfidId);
    
    if (!this.knownRFIDs.has(rfidId)) {
      this.notifyListeners(rfidId);
    } else {
      console.log('Known RFID detected:', rfidId);
    }
  }

  async refreshKnownRFIDs() {
    await this.loadKnownRFIDs();
  }
}

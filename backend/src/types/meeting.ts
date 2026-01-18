export interface MeetingRecord {
  id: number;
  meetingType: string;
  status: string;
  eventDate: string;
  meetingUrl: string;
  pdfText?: string;
}

export interface VancouverAPIMeeting {
  eventTitle: string;
  locationStatus: string;
  eventDateStart: string;
  relatedURL: string;
}

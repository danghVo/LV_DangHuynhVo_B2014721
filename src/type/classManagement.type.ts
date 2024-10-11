export interface ClassInfoPayload {
  classUuid: string;
  ownerUuid: string;
}

export interface JoinClassPayload {
  classUuid: string;
  password: string;
  studentUuid: string;
}

export interface ResponseJoinRequestPayload extends ClassInfoPayload {
  approve: boolean;
  studentUuid: string;
}

export interface AddMemberPayload extends ClassInfoPayload {
  email: string;
}

export interface RemoveMemberPayload extends ClassInfoPayload {
  studentUuid: string;
}

export interface LeaveClassPayload {
  classUuid: string;
  studentUuid: string;
}

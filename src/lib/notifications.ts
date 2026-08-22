// src/lib/notifications.ts
// Notification service — creates in-app notifications

import { db } from "./db";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  receiverId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        receiverId: params.receiverId,
        senderId: params.senderId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Never crash the main flow due to notification failure
    console.error("Failed to create notification:", error);
  }
}

export async function notifyLeaveSubmitted(
  employeeUserId: string,
  hrUserIds: string[],
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  leaveRequestId: string
): Promise<void> {
  // Notify the employee
  await createNotification({
    receiverId: employeeUserId,
    type: "LEAVE_SUBMITTED",
    title: "Leave Request Submitted",
    message: `Your ${leaveType} leave request from ${startDate} to ${endDate} has been submitted and is awaiting approval.`,
    metadata: { leaveRequestId },
  });

  // Notify all HR/Admin users
  for (const hrId of hrUserIds) {
    await createNotification({
      receiverId: hrId,
      senderId: employeeUserId,
      type: "LEAVE_SUBMITTED",
      title: "New Leave Request",
      message: `${employeeName} has submitted a ${leaveType} leave request from ${startDate} to ${endDate}.`,
      metadata: { leaveRequestId },
    });
  }
}

export async function notifyLeaveApproved(
  employeeUserId: string,
  reviewerUserId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  comment?: string,
  leaveRequestId?: string
): Promise<void> {
  await createNotification({
    receiverId: employeeUserId,
    senderId: reviewerUserId,
    type: "LEAVE_APPROVED",
    title: "Leave Request Approved ✓",
    message: `Your ${leaveType} leave request from ${startDate} to ${endDate} has been approved.${
      comment ? ` Note: ${comment}` : ""
    }`,
    metadata: { leaveRequestId },
  });
}

export async function notifyLeaveRejected(
  employeeUserId: string,
  reviewerUserId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  comment?: string,
  leaveRequestId?: string
): Promise<void> {
  await createNotification({
    receiverId: employeeUserId,
    senderId: reviewerUserId,
    type: "LEAVE_REJECTED",
    title: "Leave Request Rejected",
    message: `Your ${leaveType} leave request from ${startDate} to ${endDate} was not approved.${
      comment ? ` Reason: ${comment}` : ""
    }`,
    metadata: { leaveRequestId },
  });
}

export async function notifyPayrollUpdated(
  employeeUserId: string,
  updatedByUserId: string,
  month: number,
  year: number
): Promise<void> {
  const monthName = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
  });
  await createNotification({
    receiverId: employeeUserId,
    senderId: updatedByUserId,
    type: "PAYROLL_UPDATED",
    title: "Salary Structure Updated",
    message: `Your salary structure has been updated. This may affect your ${monthName} ${year} payroll.`,
  });
}

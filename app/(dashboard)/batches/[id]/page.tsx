"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { batchesApi } from "@/features/batches/api/batches-api";
import { studentsApi } from "@/features/students/api/students-api";
import { attendanceApi } from "@/features/attendance/api/attendance-api";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const batchId = params?.id ?? "";
  const canReadStudents = usePermission("students.read");
  const canReadAttendance = usePermission("attendance.read");
  const batchQuery = useQuery({ queryKey: ["batch", batchId], queryFn: () => batchesApi.detail(batchId), enabled: Boolean(batchId) });
  const studentsQuery = useQuery({
    queryKey: ["batch", batchId, "students"],
    queryFn: () => studentsApi.list({ page: 1, limit: 200 }),
    enabled: Boolean(batchId) && canReadStudents,
  });
  const attendanceQuery = useQuery({
    queryKey: ["batch", batchId, "attendance"],
    queryFn: () => attendanceApi.list({ page: 1, limit: 200 }),
    enabled: Boolean(batchId) && canReadAttendance,
  });

  if (batchQuery.isLoading || (canReadStudents && studentsQuery.isLoading) || (canReadAttendance && attendanceQuery.isLoading)) {
    return <LoadingState rows={6} />;
  }

  if (batchQuery.isError || !batchQuery.data) {
    return <ErrorState description="Batch detail could not be loaded." />;
  }

  const assignedStudents = canReadStudents && studentsQuery.data
    ? studentsQuery.data.items.filter((student) => student.batches.some((batch) => batch.id === batchId))
    : [];
  const batchAttendance = canReadAttendance && attendanceQuery.data
    ? attendanceQuery.data.items.filter((record) => record.batchId === batchId)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Batch detail" title={batchQuery.data.name} description="Schedule, student assignment, and attendance context for the selected batch." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Code:</span> {batchQuery.data.code}</p>
            <p><span className="text-muted-foreground">Start:</span> {formatDate(batchQuery.data.startDate)}</p>
            <p><span className="text-muted-foreground">End:</span> {formatDate(batchQuery.data.endDate)}</p>
            <p><span className="text-muted-foreground">Schedule info:</span> {batchQuery.data.scheduleInfo ?? "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Assigned students</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {canReadStudents && studentsQuery.data ? (
              <>
                <p>{assignedStudents.length} enrolled students currently mapped to this batch.</p>
                <ul className="space-y-2 text-muted-foreground">
                  {assignedStudents.slice(0, 5).map((student) => (
                    <li key={student.id}>{student.fullName}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">Student detail is hidden for your current permission scope.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Attendance analytics</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {canReadAttendance && attendanceQuery.data ? (
              <>
                <p><span className="text-muted-foreground">Records:</span> {batchAttendance.length}</p>
                <p><span className="text-muted-foreground">Present:</span> {batchAttendance.filter((record) => record.status === "PRESENT").length}</p>
                <p><span className="text-muted-foreground">Absent:</span> {batchAttendance.filter((record) => record.status === "ABSENT").length}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Attendance detail is hidden for your current permission scope.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

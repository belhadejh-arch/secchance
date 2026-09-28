package com.example.secchance.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.CareRequest
import com.example.secchance.data.SpecialistReport
import com.example.secchance.data.User

@Composable
fun CaseDetailScreen(
    request: CareRequest?,
    currentUser: User?,
    reports: List<SpecialistReport>,
    onStartPayment: (CareRequest) -> Unit,
    onAddReport: (String, String, String, String, String, String) -> Unit,
    onOpenChat: (Int) -> Unit,
    onBack: () -> Unit
) {
    var evaluation by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var recommendations by remember { mutableStateOf("") }
    var treatmentPlan by remember { mutableStateOf("") }
    var nextAppt by remember { mutableStateOf("2026-10-10") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            IconButton(onClick = onBack) {
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("رجوع للطلبات", fontWeight = FontWeight.Bold)
                }
            }
        }

        if (request != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = request.caseNumber, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text(text = "الحالة: ${request.status}", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(text = request.serviceTitle, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Text(text = "العميل: ${request.clientName} | مقدم الخدمة: ${request.providerName}", fontSize = 12.sp, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.SemiBold)
                        Text(text = request.description, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f), lineHeight = 20.sp)

                        if (!request.rejectionReason.isNullOrBlank()) {
                            Surface(color = MaterialTheme.colorScheme.errorContainer, shape = RoundedCornerShape(8.dp)) {
                                Text(
                                    text = "سبب الرفض: ${request.rejectionReason}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                        }

                        if ((request.status == "ACCEPTED" || request.status == "WAITING_PAYMENT") && request.paymentStatus == "PENDING") {
                            Button(
                                onClick = { onStartPayment(request) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Icon(imageVector = Icons.Default.Payment, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("إتمام الدفع الإلكتروني (${request.amountDzd} دج)")
                            }
                        }

                        Button(
                            onClick = { onOpenChat(1) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Chat, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("فتح غرفة المحادثة المباشرة")
                        }
                    }
                }
            }

            // Specialist Report Section for Psychologists / Lawyers
            if (currentUser?.roleSlug in listOf("psychologist", "lawyer", "treatment_center", "clinic")) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(text = "كتابة تقرير وملاحظات مهنية للحالة", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            OutlinedTextField(
                                value = evaluation,
                                onValueChange = { evaluation = it },
                                label = { Text("التقييم العيادي أو القانوني") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = notes,
                                onValueChange = { notes = it },
                                label = { Text("الملاحظات المهنية") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = recommendations,
                                onValueChange = { recommendations = it },
                                label = { Text("التوصيات") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = treatmentPlan,
                                onValueChange = { treatmentPlan = it },
                                label = { Text("الخطة العلاجية / المتابعة") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Button(
                                onClick = {
                                    if (evaluation.isNotBlank()) {
                                        onAddReport(request.caseNumber, evaluation, notes, recommendations, treatmentPlan, nextAppt)
                                        evaluation = ""
                                        notes = ""
                                        recommendations = ""
                                        treatmentPlan = ""
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("حفظ وإرسال التقرير")
                            }
                        }
                    }
                }
            }

            // Display existing reports for this case
            val caseReports = reports.filter { it.caseNumber == request.caseNumber }
            if (caseReports.isNotEmpty()) {
                item {
                    Text(text = "التقارير والمتابعات المهنية", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
                items(caseReports.size) { index ->
                    val rep = caseReports[index]
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(text = "المزود: ${rep.specialistName} (${rep.specialty})", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(text = "التقييم: ${rep.evaluation}", fontSize = 12.sp)
                            Text(text = "الملاحظات: ${rep.professionalNotes}", fontSize = 11.sp)
                            Text(text = "التوصيات: ${rep.recommendations}", fontSize = 11.sp)
                            Text(text = "الخطة: ${rep.treatmentPlan}", fontSize = 11.sp)
                            Text(text = "الموعد القادم: ${rep.nextAppointment}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        } else {
            item {
                Text("لم يتم العثور على تفاصيل الطلب.")
            }
        }
    }
}

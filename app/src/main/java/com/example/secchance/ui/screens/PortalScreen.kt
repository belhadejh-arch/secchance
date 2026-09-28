package com.example.secchance.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.CareRequest
import com.example.secchance.data.PaymentTransaction
import com.example.secchance.data.Repository
import com.example.secchance.data.User

@Composable
fun PortalScreen(
    currentUser: User,
    requests: List<CareRequest>,
    transactions: List<PaymentTransaction>,
    onSelectRequest: (CareRequest) -> Unit,
    onStartPayment: (CareRequest) -> Unit,
    onNewRequest: () -> Unit,
    onAcceptRequest: (Int, String) -> Unit,
    onRejectRequest: (Int, String) -> Unit,
    onOpenChat: (Int) -> Unit,
    onLogout: () -> Unit
) {
    var adminTab by remember { mutableStateOf("requests") }
    var providerTab by remember { mutableStateOf("waiting") }
    var rejectionDialogReqId by remember { mutableStateOf<Int?>(null) }
    var rejectionReasonInput by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Profile Header
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${currentUser.firstName} ${currentUser.lastName}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = when(currentUser.roleSlug) {
                                "family" -> "ولي أمر / باحث عن مرافقة وخدمات"
                                "patient" -> "مستفيد / متعافٍ"
                                "psychologist" -> "أخصائي نفسي عيادي معتمد"
                                "lawyer" -> "مستشار قانوني ومحامٍ"
                                "treatment_center" -> "مركز علاج الإدمان"
                                "clinic" -> "العيادة الطبية المتخصصة الشفاء"
                                "association" -> "جمعية خيرية ومرافقة اجتماعية"
                                else -> "إدارة المنصة المركزية"
                            },
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "الولاية: ${currentUser.wilayaName ?: "الجزائر"}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                    IconButton(onClick = onLogout) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = "خروج", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }

        // ROLE 1: FAMILY / PATIENT (طلباتي)
        if (currentUser.roleSlug == "family" || currentUser.roleSlug == "patient") {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "طلباتي ومتابعاتي (My Requests)", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Button(
                        onClick = onNewRequest,
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("طلب خدمة جديد", fontSize = 11.sp)
                    }
                }
            }

            val userRequests = requests.filter { it.clientId == currentUser.id }
            if (userRequests.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.FolderOpen, contentDescription = null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary)
                            Text("ليس لديك أي طلبات حالية", fontWeight = FontWeight.Bold)
                            Button(onClick = onNewRequest) {
                                Text("ابدأ بطلب استشارة أو خدمة")
                            }
                        }
                    }
                }
            } else {
                items(userRequests) { req ->
                    RequestCardForClient(
                        req = req,
                        onClick = { onSelectRequest(req) },
                        onPay = { onStartPayment(req) }
                    )
                }
            }
        }
        // ROLE 2: PROVIDERS (Psychologist, Lawyer, Treatment Center, Clinic, Association)
        else if (currentUser.roleSlug in listOf("psychologist", "lawyer", "treatment_center", "clinic", "association")) {
            val waitingRequests = requests.filter { it.providerId == currentUser.id && (it.status == "PENDING_PROVIDER" || it.status == "NEW") }
            val activeRequests = requests.filter { it.providerId == currentUser.id && it.status in listOf("ACCEPTED", "WAITING_PAYMENT", "PAID", "APPOINTMENT_CONFIRMED", "IN_PROGRESS") }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { providerTab = "waiting" },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (providerTab == "waiting") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("الطلبات في انتظارك (${waitingRequests.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { providerTab = "active" },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (providerTab == "active") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("الحالات الجارية (${activeRequests.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (providerTab == "waiting") {
                item {
                    Text(text = "الطلبات في انتظارك ⑥", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                }
                if (waitingRequests.isEmpty()) {
                    item {
                        Text("لا توجد طلبات جديدة في الانتظار حالياً.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                } else {
                    items(waitingRequests) { req ->
                        ProviderWaitingCard(
                            req = req,
                            onClick = { onSelectRequest(req) },
                            onAccept = { onAcceptRequest(req.id, req.priority) },
                            onRejectClick = { rejectionDialogReqId = req.id }
                        )
                    }
                }
            } else {
                item {
                    Text(text = "الحالات والمتابعات المقبولة والجارية", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
                items(activeRequests) { req ->
                    RequestCardForClient(
                        req = req,
                        onClick = { onSelectRequest(req) },
                        onPay = {}
                    )
                }
            }
        }
        // ROLE 3: ADMIN DASHBOARD
        else if (currentUser.roleSlug == "admin") {
            item {
                Text(text = "لوحة الإدارة والتحكم الشامل", fontSize = 18.sp, fontWeight = FontWeight.Black)
            }

            // Statistics Grid
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatBox("إجمالي المستخدمين", "${Repository.sampleUsers.size}", Modifier.weight(1f))
                    StatBox("الطلبات", "${requests.size}", Modifier.weight(1f))
                    StatBox("المدفوعات", "${transactions.size}", Modifier.weight(1f))
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val totalRev = transactions.filter { it.status == "SUCCESSFUL" }.sumOf { it.amountDzd }
                    StatBox("إجمالي الإيرادات", "$totalRev دج", Modifier.weight(1f))
                    StatBox("المواعيد المؤكدة", "${requests.count { it.status == "APPOINTMENT_CONFIRMED" }}", Modifier.weight(1f))
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { adminTab = "requests" },
                        colors = ButtonDefaults.buttonColors(containerColor = if (adminTab == "requests") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("إدارة الطلبات", fontSize = 11.sp)
                    }
                    Button(
                        onClick = { adminTab = "payments" },
                        colors = ButtonDefaults.buttonColors(containerColor = if (adminTab == "payments") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("إدارة المدفوعات", fontSize = 11.sp)
                    }
                }
            }

            if (adminTab == "requests") {
                item { Text("جميع طلبات المنصة", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                items(requests) { req ->
                    RequestCardForClient(
                        req = req,
                        onClick = { onSelectRequest(req) },
                        onPay = {}
                    )
                }
            } else {
                item { Text("سجل المعاملات والمدفوعات الإلكترونية", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                items(transactions) { txn ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = txn.paymentId, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                                    Text(text = txn.status, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), fontWeight = FontWeight.Bold)
                                }
                            }
                            Text(text = "الخدمة: ${txn.serviceTitle}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text(text = "العميل: ${txn.clientName} | مقدم الخدمة: ${txn.providerName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = "المبلغ: ${txn.amountDzd} دج (${txn.paymentMethod})", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(text = "التاريخ: ${txn.createdAt}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            }
                        }
                    }
                }
            }
        }
    }

    // Rejection Reason Dialog
    if (rejectionDialogReqId != null) {
        AlertDialog(
            onDismissRequest = { rejectionDialogReqId = null },
            title = { Text("سبب رفض الطلب") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("يرجى تحديد سبب الرفض ليتم حفظه في سجل الحالة:")
                    val reasons = listOf("لا أستطيع استقبال الحالة", "الخدمة غير متوفرة حالياً", "الموعد غير مناسب", "الحالة خارج اختصاصي", "سبب آخر")
                    reasons.forEach { r ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = rejectionReasonInput == r,
                                onClick = { rejectionReasonInput = r }
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = r, fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        rejectionDialogReqId?.let { id ->
                            onRejectRequest(id, rejectionReasonInput.ifBlank { "لم يحدد السبب" })
                        }
                        rejectionDialogReqId = null
                        rejectionReasonInput = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("تأكيد الرفض")
                }
            },
            dismissButton = {
                TextButton(onClick = { rejectionDialogReqId = null }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun StatBox(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
fun RequestCardForClient(
    req: CareRequest,
    onClick: () -> Unit,
    onPay: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = req.caseNumber,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Surface(
                    color = when (req.priority) {
                        "Critical" -> MaterialTheme.colorScheme.errorContainer
                        "High" -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.6f)
                        else -> MaterialTheme.colorScheme.secondaryContainer
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "الأولوية: ${when(req.priority) { "Critical" -> "🔴 عاجلة جداً"; "High" -> "🟠 عاجلة"; "Medium" -> "🟡 متوسطة"; else -> "🟢 عادية" }}",
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }

            Text(
                text = req.serviceTitle,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "مقدم الخدمة: ${req.providerName} | الولاية: ${req.wilayaName}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = when(req.status) {
                        "ACCEPTED", "WAITING_PAYMENT" -> MaterialTheme.colorScheme.primaryContainer
                        "PAID", "APPOINTMENT_CONFIRMED", "COMPLETED" -> MaterialTheme.colorScheme.secondaryContainer
                        "REJECTED" -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "الحالة: ${when(req.status) {
                            "NEW", "PENDING_PROVIDER" -> "في انتظار مقدم الخدمة"
                            "ACCEPTED", "WAITING_PAYMENT" -> "مقبول - بانتظار الدفع"
                            "PAID", "APPOINTMENT_CONFIRMED" -> "مدفوع وموعد مؤكد"
                            "COMPLETED" -> "مكتملة"
                            "REJECTED" -> "مرفوض"
                            else -> req.status
                        }}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Text(
                    text = "${req.amountDzd} دج",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            if ((req.status == "ACCEPTED" || req.status == "WAITING_PAYMENT") && req.paymentStatus == "PENDING") {
                Button(
                    onClick = onPay,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Icon(imageVector = Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("الدفع الآن (البطاقة الذهبية / CIB)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun ProviderWaitingCard(
    req: CareRequest,
    onClick: () -> Unit,
    onAccept: () -> Unit,
    onRejectClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = req.caseNumber, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Text(text = "العميل: ${req.clientName}", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Text(text = req.serviceTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(text = req.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f), maxLines = 2)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onAccept,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("قبول الطلب")
                }
                OutlinedButton(
                    onClick = onRejectClick,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("رفض الطلب")
                }
            }
        }
    }
}

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

@Composable
fun PaymentScreen(
    request: CareRequest?,
    onProcessPayment: (Int, String) -> Unit,
    onCancel: () -> Unit
) {
    var selectedMethod by remember { mutableStateOf("EDAHABIA") }
    var cardNumber by remember { mutableStateOf("") }
    var cardHolder by remember { mutableStateOf("") }
    var expiryDate by remember { mutableStateOf("") }
    var cvv by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "إتمام الدفع الإلكتروني (البطاقة الذهبية / CIB)", fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text(text = "بوابة دفع آمنة ومعتمدة في الجزائر. لا يتم تخزين بيانات بطاقتك على الخادم.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        if (request != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = "تفاصيل العملية:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                        Text(text = "الخدمة: ${request.serviceTitle}", fontSize = 13.sp)
                        Text(text = "مقدم الخدمة: ${request.providerName}", fontSize = 12.sp)
                        Text(text = "رقم الحالة: ${request.caseNumber}", fontSize = 11.sp)
                        Divider()
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "المبلغ الإجمالي الواجب دفعه:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(text = "${request.amountDzd} دج", fontWeight = FontWeight.Black, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        }
                    }
                }
            }

            item {
                Text(text = "اختر طريقة الدفع الإلكتروني", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Card(
                        onClick = { selectedMethod = "EDAHABIA" },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedMethod == "EDAHABIA") MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surface
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.CreditCard, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("البطاقة الذهبية", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                    Card(
                        onClick = { selectedMethod = "CIB" },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedMethod == "CIB") MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surface
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.AccountBalance, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("بطاقة CIB", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = cardNumber,
                    onValueChange = { cardNumber = it },
                    label = { Text("رقم البطاقة (16 رقماً)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }
            item {
                OutlinedTextField(
                    value = cardHolder,
                    onValueChange = { cardHolder = it },
                    label = { Text("اسم صاحب البطاقة") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = expiryDate,
                        onValueChange = { expiryDate = it },
                        label = { Text("تاريخ الصلاحية (MM/YY)") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = cvv,
                        onValueChange = { cvv = it },
                        label = { Text("الرمز السري (CVV)") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        if (cardNumber.isNotBlank()) {
                            onProcessPayment(request.id, selectedMethod)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("دفع آمن ومؤكد (${request.amountDzd} دج)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Spacer(modifier = Modifier.height(6.dp))
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier.fillMaxWidth().height(46.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("إلغاء والعودة للطلبات")
                }
            }
        }
    }
}

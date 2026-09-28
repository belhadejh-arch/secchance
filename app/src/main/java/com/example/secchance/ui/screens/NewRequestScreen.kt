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
import com.example.secchance.data.ALGERIA_WILAYAS
import com.example.secchance.data.ServiceItem

@Composable
fun NewRequestScreen(
    services: List<ServiceItem>,
    onSubmit: (Int, String, String, String) -> Unit,
    onCancel: () -> Unit
) {
    var selectedServiceId by remember { mutableStateOf(services.firstOrNull()?.id ?: 1) }
    var priority by remember { mutableStateOf("High") }
    var wilaya by remember { mutableStateOf("الجزائر العاصمة") }
    var description by remember { mutableStateOf("") }

    val currentService = services.find { it.id == selectedServiceId } ?: services.firstOrNull()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "طلب خدمة أو استشارة جديدة", fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text(text = "يرجى اختيار الخدمة المطلوبة وتحديد الأولوية لضمان سرعة التكفل بالحالة", fontSize = 11.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        item {
            Text(text = "اختر الخدمة أو الاستشارة", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            services.forEach { service ->
                Card(
                    onClick = { selectedServiceId = service.id },
                    colors = CardDefaults.cardColors(
                        containerColor = if (service.id == selectedServiceId) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = service.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(text = "المزود: ${service.providerName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        }
                        Text(text = "${service.amountDzd} دج", fontWeight = FontWeight.Black, fontSize = 13.sp, color = MaterialTheme.colorScheme.secondary)
                    }
                }
            }
        }

        item {
            Text(text = "مستوى الأولوية", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            val priorities = listOf("Critical" to "🔴 عاجلة جداً", "High" to "🟠 عاجلة", "Medium" to "🟡 متوسطة", "Low" to "🟢 عادية")
            priorities.forEach { p ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    RadioButton(selected = priority == p.first, onClick = { priority = p.first })
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = p.second, fontSize = 13.sp)
                }
            }
        }

        item {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("تفاصيل الحالة أو الملاحظات الإضافية") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                shape = RoundedCornerShape(12.dp)
            )
        }

        item {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = {
                    if (description.isNotBlank() && currentService != null) {
                        onSubmit(currentService.id, priority, wilaya, description)
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = description.isNotBlank()
            ) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("إرسال الطلب لمقدم الخدمة بأمان", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth().height(46.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("إلغاء والرجوع")
            }
        }
    }
}

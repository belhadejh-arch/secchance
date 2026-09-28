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

@Composable
fun NewCaseScreen(
    onSubmit: (String, String, String, String) -> Unit,
    onCancel: () -> Unit
) {
    var description by remember { mutableStateOf("") }
    var addictionType by remember { mutableStateOf("المؤثرات العقلية / الصيدلانية") }
    var priority by remember { mutableStateOf("High") }
    var wilaya by remember { mutableStateOf("الجزائر العاصمة") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "فتح ملف حالة جديد (سري وبسرية تامة)", fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text(text = "يرجى تقديم تفاصيل الحالة لتمكين الخبراء ومراكز العلاج من توفير المرافقة اللازمة", fontSize = 11.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        item {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("وصف الحالة أو طلب المساعدة") },
                modifier = Modifier.fillMaxWidth().height(140.dp),
                shape = RoundedCornerShape(12.dp)
            )
        }

        item {
            Text(text = "نوع الإدمان أو الاستشارة", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            val types = listOf("المؤثرات العقلية / الصيدلانية", "المخدرات الصلبة", "القنب الهندي", "استشارات أسرية وقانونية")
            types.forEach { t ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    RadioButton(selected = addictionType == t, onClick = { addictionType = t })
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = t, fontSize = 13.sp)
                }
            }
        }

        item {
            Text(text = "مستوى الأولوية", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            val priorities = listOf("Critical" to "حرجة وعاجلة جداً", "High" to "عالية", "Medium" to "متوسطة", "Low" to "منخفضة")
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
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = {
                    if (description.isNotBlank()) {
                        onSubmit(description, addictionType, priority, wilaya)
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = description.isNotBlank()
            ) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("إرسال ملف الحالة بأمان", fontWeight = FontWeight.Bold, fontSize = 14.sp)
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

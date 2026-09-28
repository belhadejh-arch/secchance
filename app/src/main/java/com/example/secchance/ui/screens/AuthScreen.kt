package com.example.secchance.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.Repository
import com.example.secchance.data.User

@Composable
fun AuthScreen(
    onLoginSuccess: (User) -> Unit,
    onCancel: () -> Unit
) {
    var selectedRole by remember { mutableStateOf("family") }

    val roles = listOf(
        "family" to "عائلة / مواطن (ولي أمر أو باحث عن علاج وعمليات دفع)",
        "psychologist" to "أخصائي نفسي عيادي (لوحة الطلبات في انتظارك والتفارير)",
        "lawyer" to "مستشار قانوني ومحامٍ (استشارات وقضايا)",
        "treatment_center" to "مركز علاج الإدمان (إدارة الأسرة وإزالة السموم)",
        "clinic" to "العيادة الطبية المتخصصة (إدارة الأطباء والمواعيد)",
        "association" to "جمعية خيرية ومرافقة اجتماعية",
        "admin" to "الإدارة العامة للمنصة (لوحة التحكم الشاملة والمدفوعات)"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Text(text = "تسجيل الدخول وربط الأطراف", fontSize = 20.sp, fontWeight = FontWeight.Black)
            Text(text = "اختر دور الحساب لاستعراض اللوحة والعمليات المرتبطة بها", fontSize = 12.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        items(roles.size) { index ->
            val rolePair = roles[index]
            val isSelected = selectedRole == rolePair.first
            Card(
                onClick = { selectedRole = rolePair.first },
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = rolePair.second,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        fontSize = 13.sp,
                        color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                    RadioButton(
                        selected = isSelected,
                        onClick = { selectedRole = rolePair.first }
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = {
                    val user = Repository.sampleUsers.find { it.roleSlug == selectedRole } ?: Repository.sampleUsers.first()
                    onLoginSuccess(user)
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("دخول الحساب واستعراض اللوحة", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("رجوع للرئيسية")
            }
        }
    }
}

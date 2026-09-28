package com.example.secchance.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.Repository

@Composable
fun DirectoryScreen() {
    val centers = Repository.treatmentCenters
    val associations = Repository.associations

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "دليل مراكز علاج الإدمان والجمعيات", fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text(text = "قائمة المراكز الاستشفائية والجمعيات المعتمدة عبر ولايات الوطن", fontSize = 11.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        item {
            Text(text = "مراكز علاج الإدمان المعتمدة", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }

        items(centers) { center ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = center.name, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = RoundedCornerShape(6.dp)) {
                            Text(text = center.wilayaName, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), fontWeight = FontWeight.Bold)
                        }
                    }
                    Text(text = center.address, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                    Text(text = "الهاتف: ${center.phone}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "الخدمات: ${center.services}", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(10.dp))
            Text(text = "الجمعيات الوطنية والولائية", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }

        items(associations) { assoc ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = assoc.name, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                            Text(text = assoc.wilayaName, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), fontWeight = FontWeight.Bold)
                        }
                    }
                    Text(text = assoc.address, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                    Text(text = "الهاتف: ${assoc.phone}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "النشاط: ${assoc.services}", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }
    }
}

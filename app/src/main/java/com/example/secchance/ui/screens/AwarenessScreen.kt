package com.example.secchance.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.Repository

@Composable
fun AwarenessScreen() {
    val articles = Repository.awarenessArticles

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "المراجع القانونية والتوعية والإرشاد (التشريع الجزائري)", fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text(text = "أدلة رسمية ومقالات توعوية وفق التشريع الجزائري (القانون 04-18، وتعديلاته 23-05 و25-03، والمرسوم 07-229)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
        }

        // Legal Reference Box Card
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
                    Text(text = "📜 المراجع التشريعية الرسمية المعتمدة", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                    Text(text = "• القانون رقم 04-18 (25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية.\n• القانون رقم 23-05 (7 مايو 2023) المعدل والمتمم للقانون 04-18.\n• القانون رقم 25-03 (1 يوليو 2025) المعدل والمتمم.\n• المرسوم التنفيذي رقم 07-229 (30 يوليو 2007) المتعلق بكيفيات تطبيق المادة 6 (العلاج والمتابعة الطبية).", fontSize = 11.sp, lineHeight = 18.sp)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = "⚠️ تنبيه قانوني: هذه المعلومات توعوية وإرشادية ولا تغني عن الاستشارة القانونية الفردية مع محامٍ معتمد.", fontSize = 10.sp, color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(articles) { article ->
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
                        Text(text = article.category, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        Text(text = "آخر مراجعة: ${article.date}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                    Text(text = article.title, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text(text = article.summary, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f), lineHeight = 18.sp)
                    Text(text = "الكاتب / المصدر: ${article.author}", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

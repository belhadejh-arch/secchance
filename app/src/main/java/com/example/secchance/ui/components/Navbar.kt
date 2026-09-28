package com.example.secchance.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.secchance.data.User

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Navbar(
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onOpenAuth: () -> Unit,
    onOpenAiTriage: () -> Unit,
    onLogout: () -> Unit
) {
    Surface(
        tonalElevation = 3.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.clickable { onNavigate("landing") }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "منصة الفرصة الثانية",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "الدعم النفسي والقانوني ومحاربة الإدمان",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onOpenAiTriage) {
                        Icon(
                            imageVector = Icons.Default.SmartToy,
                            contentDescription = "التوجيه الذكي",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = { onNavigate("emergency") }) {
                        Icon(
                            imageVector = Icons.Default.PhoneInTalk,
                            contentDescription = "الطوارئ",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                    if (currentUser != null) {
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 4.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.primaryContainer)
                                .clickable { onNavigate("portal") }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = currentUser.firstName,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    } else {
                        Button(
                            onClick = onOpenAuth,
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text("دخول", fontSize = 11.sp)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
            // Quick Sub-nav bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SubNavButton("الرئيسية", Icons.Default.Home) { onNavigate("landing") }
                SubNavButton("الخدمات", Icons.Default.MedicalServices) { onNavigate("services") }
                SubNavButton("المراكز", Icons.Default.LocationCity) { onNavigate("directory") }
                SubNavButton("التوعية", Icons.Default.Book) { onNavigate("awareness") }
                SubNavButton("الطوارئ", Icons.Default.Warning) { onNavigate("emergency") }
            }
        }
    }
}

@Composable
fun SubNavButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    TextButton(
        onClick = onClick,
        contentPadding = PaddingValues(4.dp),
        modifier = Modifier.height(28.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

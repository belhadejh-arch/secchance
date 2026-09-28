package com.example.secchance.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable

@Composable
fun BottomNavigator(
    currentView: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar {
        NavigationBarItem(
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            label = { Text("الرئيسية") },
            selected = currentView == "landing",
            onClick = { onNavigate("landing") }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.MedicalServices, contentDescription = null) },
            label = { Text("الخدمات") },
            selected = currentView == "services",
            onClick = { onNavigate("services") }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.FolderOpen, contentDescription = null) },
            label = { Text("طلباتي") },
            selected = currentView == "portal" || currentView == "case-detail",
            onClick = { onNavigate("portal") }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.CalendarMonth, contentDescription = null) },
            label = { Text("المواعيد") },
            selected = currentView == "appointments",
            onClick = { onNavigate("appointments") }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Chat, contentDescription = null) },
            label = { Text("الرسائل") },
            selected = currentView == "messages",
            onClick = { onNavigate("messages") }
        )
    }
}

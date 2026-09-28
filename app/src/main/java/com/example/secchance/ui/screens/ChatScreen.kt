package com.example.secchance.ui.screens

import androidx.compose.foundation.background
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
import com.example.secchance.data.Conversation
import com.example.secchance.data.Message

@Composable
fun ChatScreen(
    conversations: List<Conversation>,
    messagesMap: Map<Int, List<Message>>,
    onSendMessage: (Int, String) -> Unit
) {
    var selectedConvId by remember { mutableStateOf(conversations.firstOrNull()?.id ?: 1) }
    var textInput by remember { mutableStateOf("") }

    val currentMessages = messagesMap[selectedConvId] ?: emptyList()

    Row(modifier = Modifier.fillMaxSize()) {
        // Conversations Sidebar on larger screens or list
        Column(
            modifier = Modifier
                .width(240.dp)
                .fillMaxHeight()
                .background(MaterialTheme.colorScheme.surface)
                .padding(12.dp)
        ) {
            Text(text = "غرف المحادثة والمتابعة", fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 10.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(conversations) { conv ->
                    val isSelected = conv.id == selectedConvId
                    Card(
                        onClick = { selectedConvId = conv.id },
                        colors = CardDefaults.cardColors(containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(text = conv.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Text(text = conv.caseNumber, fontSize = 10.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }

        // Message Room
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Messages List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(currentMessages) { msg ->
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (msg.isFromMe) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Surface(
                            color = if (msg.isFromMe) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.widthIn(max = 280.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = msg.senderName,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (msg.isFromMe) Color.White.copy(alpha = 0.8f) else MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = msg.content,
                                    fontSize = 12.sp,
                                    color = if (msg.isFromMe) Color.White else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Input Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = textInput,
                    onValueChange = { textInput = it },
                    placeholder = { Text("اكتب رسالتك السرية هنا...") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )
                IconButton(
                    onClick = {
                        if (textInput.isNotBlank()) {
                            onSendMessage(selectedConvId, textInput)
                            textInput = ""
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.primary)
                ) {
                    Icon(imageVector = Icons.Default.Send, contentDescription = null, tint = Color.White)
                }
            }
        }
    }
}

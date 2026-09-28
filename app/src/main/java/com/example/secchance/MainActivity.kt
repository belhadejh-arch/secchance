package com.example.secchance

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.secchance.ui.components.BottomNavigator
import com.example.secchance.ui.components.Navbar
import com.example.secchance.ui.screens.*
import com.example.secchance.ui.theme.SecChanceTheme
import com.example.secchance.data.MainViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SecChanceTheme {
                val currentView by viewModel.currentView.collectAsState()
                val currentUser by viewModel.currentUser.collectAsState()
                val services by viewModel.services.collectAsState()
                val careRequests by viewModel.careRequests.collectAsState()
                val paymentTransactions by viewModel.paymentTransactions.collectAsState()
                val specialistReports by viewModel.specialistReports.collectAsState()
                val appointments by viewModel.appointments.collectAsState()
                val conversations by viewModel.conversations.collectAsState()
                val messagesMap by viewModel.messages.collectAsState()
                val selectedRequest by viewModel.selectedRequest.collectAsState()
                val paymentTargetRequest by viewModel.paymentTargetRequest.collectAsState()
                val aiTriageResult by viewModel.aiTriageResult.collectAsState()
                val isAiLoading by viewModel.isAiLoading.collectAsState()

                var isAuthOpen by remember { mutableStateOf(false) }
                var isAiOpen by remember { mutableStateOf(false) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        Navbar(
                            currentUser = currentUser,
                            onNavigate = { view -> viewModel.navigateTo(view) },
                            onOpenAuth = { isAuthOpen = true },
                            onOpenAiTriage = { isAiOpen = true },
                            onLogout = { viewModel.logout() }
                        )
                    },
                    bottomBar = {
                        BottomNavigator(
                            currentView = currentView,
                            onNavigate = { view -> viewModel.navigateTo(view) }
                        )
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
                        when (currentView) {
                            "landing" -> LandingScreen(
                                onNavigate = { viewModel.navigateTo(it) },
                                onOpenAiTriage = { isAiOpen = true },
                                onNewCase = {
                                    if (currentUser != null) viewModel.navigateTo("new-request")
                                    else isAuthOpen = true
                                }
                            )
                            "portal" -> {
                                if (currentUser != null) {
                                    PortalScreen(
                                        currentUser = currentUser!!,
                                        requests = careRequests,
                                        transactions = paymentTransactions,
                                        onSelectRequest = { req -> viewModel.selectRequest(req) },
                                        onStartPayment = { req -> viewModel.startPayment(req) },
                                        onNewRequest = { viewModel.navigateTo("new-request") },
                                        onAcceptRequest = { id, prio -> viewModel.acceptRequest(id, prio) },
                                        onRejectRequest = { id, reason -> viewModel.rejectRequest(id, reason) },
                                        onOpenChat = { convId -> viewModel.navigateTo("messages") },
                                        onLogout = { viewModel.logout() }
                                    )
                                } else {
                                    AuthScreen(
                                        onLoginSuccess = { user ->
                                            viewModel.login(user)
                                            isAuthOpen = false
                                        },
                                        onCancel = { viewModel.navigateTo("landing") }
                                    )
                                }
                            }
                            "services" -> ServicesScreen(
                                services = services,
                                onRequestService = { _ ->
                                    if (currentUser != null) viewModel.navigateTo("new-request")
                                    else isAuthOpen = true
                                }
                            )
                            "new-request" -> NewRequestScreen(
                                services = services,
                                onSubmit = { serviceId, prio, wilaya, desc ->
                                    viewModel.createRequest(serviceId, prio, wilaya, desc)
                                },
                                onCancel = { viewModel.navigateTo("portal") }
                            )
                            "case-detail" -> CaseDetailScreen(
                                request = selectedRequest,
                                currentUser = currentUser,
                                reports = specialistReports,
                                onStartPayment = { req -> viewModel.startPayment(req) },
                                onAddReport = { caseNo, eval, notes, rec, plan, next ->
                                    viewModel.addSpecialistReport(caseNo, eval, notes, rec, plan, next)
                                },
                                onOpenChat = { _ -> viewModel.navigateTo("messages") },
                                onBack = { viewModel.navigateTo("portal") }
                            )
                            "payment" -> PaymentScreen(
                                request = paymentTargetRequest,
                                onProcessPayment = { reqId, method ->
                                    viewModel.processPayment(reqId, method)
                                },
                                onCancel = { viewModel.navigateTo("portal") }
                            )
                            "appointments" -> AppointmentsScreen(
                                appointments = appointments,
                                onBookNew = { viewModel.navigateTo("new-request") }
                            )
                            "messages" -> ChatScreen(
                                conversations = conversations,
                                messagesMap = messagesMap,
                                onSendMessage = { convId, text -> viewModel.sendMessage(convId, text) }
                            )
                            "directory" -> DirectoryScreen()
                            "awareness" -> AwarenessScreen()
                            "emergency" -> EmergencyScreen()
                        }

                        if (isAuthOpen) {
                            AuthScreen(
                                onLoginSuccess = { user ->
                                    viewModel.login(user)
                                    isAuthOpen = false
                                },
                                onCancel = { isAuthOpen = false }
                            )
                        }

                        if (isAiOpen) {
                            AITriageDialog(
                                aiResult = aiTriageResult,
                                isLoading = isAiLoading,
                                onRunTriage = { query -> viewModel.runAiTriage(query) },
                                onDismiss = {
                                    isAiOpen = false
                                    viewModel.clearAiTriage()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

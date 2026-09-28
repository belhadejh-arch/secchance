package com.example.secchance.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF1766A6),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFEAF3F8),
    onPrimaryContainer = Color(0xFF104A78),
    secondary = Color(0xFF25866D),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE8F4EF),
    onSecondaryContainer = Color(0xFF1A5E4D),
    background = Color(0xFFF3F7F6),
    onBackground = Color(0xFF203945),
    surface = Color(0xFFFBFDFC),
    onSurface = Color(0xFF203945),
    error = Color(0xFFA64842),
    onError = Color(0xFFFFFFFF)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF4FA3E0),
    onPrimary = Color(0xFF00325B),
    primaryContainer = Color(0xFF104A78),
    onPrimaryContainer = Color(0xFFEAF3F8),
    secondary = Color(0xFF4DB39A),
    onSecondary = Color(0xFF00382B),
    secondaryContainer = Color(0xFF1A5E4D),
    onSecondaryContainer = Color(0xFFE8F4EF),
    background = Color(0xFF121B22),
    onBackground = Color(0xFFE2EBEA),
    surface = Color(0xFF1A262E),
    onSurface = Color(0xFFE2EBEA),
    error = Color(0xFFF2B8B5),
    onError = Color(0xFF601410)
)

@Composable
fun SecChanceTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}

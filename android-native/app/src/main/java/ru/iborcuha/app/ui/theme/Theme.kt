package ru.iborcuha.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Accent = Color(0xFFDC2626)
val AccentDark = Color(0xFFB91C1C)
val AccentLight = Color(0xFFEF4444)

val BgDark = Color(0xFF0A0A0F)
val BgDarkElevated = Color(0xFF15151F)
val BgLight = Color(0xFFF2F2F7)

val Success = Color(0xFF22C55E)
val Warning = Color(0xFFFBBF24)
val Danger = Color(0xFFF87171)
val Info = Color(0xFF3B82F6)
val Purple = Color(0xFFA855F7)

val TrainerGradientStart = Color(0xFFA855F7)
val TrainerGradientEnd = Color(0xFF3B82F6)
val StudentGradientStart = Color(0xFF22C55E)
val StudentGradientEnd = Color(0xFF0EA5E9)
val AdminGradientStart = Color(0xFFF59E0B)
val AdminGradientEnd = Color(0xFF7C3AED)
val BrandGradientStart = Color(0xFFDC2626)
val BrandGradientEnd = Color(0xFFB91C1C)
val FireGradientStart = Color(0xFFFBBF24)
val FireGradientMid = Color(0xFFF97316)
val FireGradientEnd = Color(0xFFDC2626)

val TextPrimary = Color.White
val TextSecondary = Color.White.copy(alpha = 0.7f)
val TextTertiary = Color.White.copy(alpha = 0.45f)
val TextQuaternary = Color.White.copy(alpha = 0.25f)

val GlassBgDark = Color.White.copy(alpha = 0.05f)
val GlassBorderDark = Color.White.copy(alpha = 0.08f)
val GlassHighlightDark = Color.White.copy(alpha = 0.15f)

private val DarkColorScheme = darkColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    secondary = Purple,
    background = BgDark,
    surface = BgDarkElevated,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = Danger,
    onError = Color.White,
)

private val LightColorScheme = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    secondary = Purple,
    background = BgLight,
    surface = Color.White,
    onBackground = Color.Black,
    onSurface = Color.Black,
    error = Danger,
    onError = Color.White,
)

@Composable
fun IBorcuhaTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content,
    )
}

package ru.iborcuha.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*

@Composable
fun LoginScreen(
    onLogin: (phone: String, password: String) -> Unit,
    isLoading: Boolean,
    error: String?,
    onClearError: () -> Unit,
) {
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
    ) {
        // Ambient blobs
        Box(
            Modifier
                .offset(x = (-60).dp, y = (-40).dp)
                .size(300.dp)
                .clip(CircleShape)
                .background(Accent.copy(alpha = 0.2f))
        )
        Box(
            Modifier
                .offset(x = 200.dp, y = 200.dp)
                .size(250.dp)
                .clip(CircleShape)
                .background(Purple.copy(alpha = 0.15f))
        )
        Box(
            Modifier
                .offset(x = 50.dp, y = 500.dp)
                .size(280.dp)
                .clip(CircleShape)
                .background(FireGradientStart.copy(alpha = 0.12f))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(top = 100.dp, bottom = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Logo
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(listOf(BrandGradientStart, BrandGradientEnd))
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "iB",
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
            }
            Spacer(Modifier.height(20.dp))
            Text(
                "iBorcuha",
                fontSize = 34.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = (-1).sp,
            )
            Text(
                "ПЛАТФОРМА ДЛЯ ТРЕНЕРОВ",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextTertiary,
                letterSpacing = 3.sp,
            )

            Spacer(Modifier.height(40.dp))

            // Error
            AnimatedVisibility(visible = error != null) {
                error?.let {
                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        radius = 16.dp,
                        padding = 14.dp,
                    ) {
                        Text(
                            it,
                            color = Danger,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }

            // Form
            LiquidGlassCard(
                modifier = Modifier.fillMaxWidth(),
                radius = 28.dp,
                padding = 24.dp,
            ) {
                Text(
                    "Вход",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Spacer(Modifier.height(20.dp))

                // Phone
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = formatPhone(it) },
                    placeholder = { Text("8 (900) 123-45-67", color = TextQuaternary) },
                    leadingIcon = { Icon(Icons.Outlined.Phone, null, tint = TextTertiary) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    colors = glassTextFieldColors(),
                    singleLine = true,
                )
                Spacer(Modifier.height(12.dp))

                // Password
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = { Text("Пароль", color = TextQuaternary) },
                    leadingIcon = { Icon(Icons.Outlined.Lock, null, tint = TextTertiary) },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                null,
                                tint = TextTertiary,
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    colors = glassTextFieldColors(),
                    singleLine = true,
                )
                Spacer(Modifier.height(20.dp))

                // Login button
                Button(
                    onClick = {
                        val digits = phone.replace(Regex("\\D"), "")
                        onClearError()
                        onLogin(digits, password)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(),
                    enabled = !isLoading,
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(listOf(BrandGradientStart, BrandGradientEnd)),
                                RoundedCornerShape(16.dp),
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White,
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Login, null, tint = Color.White, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Войти", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Demo
            Text(
                "ДЕМО-ДОСТУП",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TextTertiary,
                letterSpacing = 1.sp,
            )
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LiquidGlassCard(
                    modifier = Modifier.weight(1f),
                    radius = 16.dp,
                    padding = 16.dp,
                    onClick = { onLogin("89999999999", "demo123") },
                ) {
                    Text("🥋", fontSize = 28.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("Тренер", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                }
                LiquidGlassCard(
                    modifier = Modifier.weight(1f),
                    radius = 16.dp,
                    padding = 16.dp,
                    onClick = { onLogin("89990000001", "demo123") },
                ) {
                    Text("🤼", fontSize = 28.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("Спортсмен", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                }
            }

            Spacer(Modifier.height(24.dp))

            // Sport tags
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                listOf("BJJ", "MMA", "Самбо", "Дзюдо", "Грэпплинг").forEach { tag ->
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = Color.White.copy(alpha = 0.05f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(0.08f)),
                        modifier = Modifier.padding(horizontal = 3.dp),
                    ) {
                        Text(
                            tag,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary,
                            letterSpacing = 0.5.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun glassTextFieldColors() = OutlinedTextFieldDefaults.colors(
    unfocusedBorderColor = Color.White.copy(alpha = 0.08f),
    focusedBorderColor = Accent.copy(alpha = 0.5f),
    unfocusedContainerColor = Color.White.copy(alpha = 0.04f),
    focusedContainerColor = Color.White.copy(alpha = 0.06f),
    cursorColor = Accent,
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
)

private fun formatPhone(value: String): String {
    val digits = value.replace(Regex("\\D"), "").take(11)
    if (digits.isEmpty()) return ""
    val d = if (digits.startsWith("7")) "8${digits.drop(1)}" else if (!digits.startsWith("8")) "8$digits" else digits
    val sb = StringBuilder()
    if (d.isNotEmpty()) sb.append(d[0])
    if (d.length > 1) sb.append(" (${d.substring(1, minOf(4, d.length))}")
    if (d.length >= 4) sb.append(") ")
    if (d.length > 4) sb.append(d.substring(4, minOf(7, d.length)))
    if (d.length > 7) sb.append("-${d.substring(7, minOf(9, d.length))}")
    if (d.length > 9) sb.append("-${d.substring(9, minOf(11, d.length))}")
    return sb.toString()
}

package ru.iborcuha.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import ru.iborcuha.app.data.models.*
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*

@Composable
fun TournamentsScreen(
    navController: NavController,
    data: DataBundle,
) {
    Box(Modifier.fillMaxSize().background(BgDark)) {
        Box(Modifier.offset((-60).dp, (-40).dp).size(280.dp).clip(CircleShape).background(Purple.copy(0.15f)))

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 60.dp, bottom = 140.dp)
        ) {
            Text(
                "Турниры",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                modifier = Modifier.padding(bottom = 20.dp),
            )

            data.tournaments.forEach { t ->
                LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(44.dp).clip(CircleShape).background(Brush.linearGradient(listOf(FireGradientStart, FireGradientEnd))), contentAlignment = Alignment.Center) {
                            Icon(Icons.Filled.EmojiEvents, null, tint = Color.White, modifier = Modifier.size(22.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(t.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(t.date + " · " + t.location, fontSize = 12.sp, color = TextTertiary)
                        }
                    }
                }
            }
            if (data.tournaments.isEmpty()) {
                LiquidGlassCard(Modifier.fillMaxWidth(), radius = 20.dp, padding = 32.dp) {
                    Text("Нет турниров", fontSize = 16.sp, color = TextTertiary, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }
        }
    }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiAssistantQueryDto } from './ai-assistant.dto.js';

@Injectable()
export class AiAssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async answerQuery(dto: AiAssistantQueryDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const q = dto.query.toLowerCase();
    let answer = '';
    let category = 'GENERAL_INFO';

    if (q.includes('wifi') || q.includes('internet') || q.includes('password')) {
      category = 'WIFI_INFO';
      answer = property.wifiNetwork
        ? `Wi-Fi Network Name: "${property.wifiNetwork}". Password: "${property.wifiPassword || 'No password required'}".`
        : 'Wi-Fi details have not been provided for this listing yet.';
    } else if (q.includes('checkin') || q.includes('check-in') || q.includes('key') || q.includes('entry') || q.includes('arrival')) {
      category = 'CHECKIN_INFO';
      answer = property.checkInInstructions
        ? `Check-in Instructions: ${property.checkInInstructions}`
        : 'Standard check-in is after 2:00 PM. Please message the host prior to arrival.';
    } else if (q.includes('rule') || q.includes('pet') || q.includes('smoke') || q.includes('party') || q.includes('quiet')) {
      category = 'HOUSE_RULES';
      answer = property.houseRules && property.houseRules.length > 0
        ? `House Rules: ${property.houseRules.join('; ')}`
        : 'No special house rules listed. Please treat the home with care.';
    } else if (q.includes('address') || q.includes('location') || q.includes('where') || q.includes('direction')) {
      category = 'LOCATION_INFO';
      answer = `Address: ${property.address || ''}, ${property.locality || ''}, ${property.city}, ${property.state}, ${property.country} - ${property.pincode || ''}.`;
    } else {
      // Knowledge base lookup
      const kbPublic = property.aiKnowledgeBasePublic || '';
      const kbPrivate = property.aiKnowledgeBasePrivate || '';

      answer = `Fairbnb AI Support for "${property.title}": ${property.description}. ${kbPublic} ${kbPrivate}`.trim();
    }

    return {
      propertyId: property.id,
      propertyTitle: property.title,
      query: dto.query,
      category,
      answer,
      timestamp: new Date(),
    };
  }
}

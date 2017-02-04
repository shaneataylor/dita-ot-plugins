<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:fn="http://example.com/namespace"
    exclude-result-prefixes="xs fn"
    version="2.0">
    
    <xsl:output method="text" encoding="UTF-8" indent="no"/>
    
    <xsl:template match="/*">
        <xsl:text>{
</xsl:text>
        <xsl:for-each-group select="//stem" group-by="@value">
            <xsl:sort select="@value"/>
            <xsl:text>"</xsl:text><xsl:value-of select="current-grouping-key()"/><xsl:text>":[</xsl:text>
            <xsl:for-each select="current-group()">
                <xsl:sort select="@score" order="descending" data-type="number"/>
                <xsl:text>{"</xsl:text>
                <xsl:value-of select="@href"/>
                <xsl:text>":"</xsl:text>
                <xsl:value-of select="@score"/>
                <xsl:text>"}</xsl:text>
                <xsl:if test="position() != last()">
                    <xsl:text>,</xsl:text>
                </xsl:if>
            </xsl:for-each>
            <xsl:choose>
                <xsl:when test="position() != last()">
                    <xsl:text>],
</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text>]
}</xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:for-each-group>
    </xsl:template>
    
    
</xsl:stylesheet>
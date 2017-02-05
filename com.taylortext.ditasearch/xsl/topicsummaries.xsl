<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:fn="http://example.com/namespace"
    exclude-result-prefixes="xs fn"
    version="2.0">
    
    <xsl:output method="text" encoding="UTF-8" indent="no"/>
    
    <xsl:function name="fn:JSONify" as="xs:string">
        <xsl:param name="input" as="xs:string"/>
        <xsl:variable name="escape-bs" select="replace($input,'\\','\\\\')"/>
        <xsl:variable name="escape-quotes" select="replace($escape-bs,'&quot;','\\u0022')"/>
        <xsl:value-of select="$escape-quotes"/>
    </xsl:function>
    
    <xsl:template match="/*">
        <xsl:text>topicsummaries : {
</xsl:text>
        <xsl:apply-templates select="topicSummary"/>
        <xsl:text>
}
};
</xsl:text>
    </xsl:template>
    
    <xsl:template match="//topicSummary">
        <xsl:text>"</xsl:text>
        <xsl:value-of select="@href"/>
        <xsl:text>" : {"searchtitle" : "</xsl:text>
        <xsl:value-of select="fn:JSONify(@searchtitle)"/>
        <xsl:text>" , "shortdesc" : "</xsl:text>
        <xsl:value-of select="fn:JSONify(@shortdesc)"/>
        <xsl:text>"}</xsl:text>
        <xsl:if test="not(position() = last())">
            <xsl:text>,
</xsl:text>
        </xsl:if>
    </xsl:template>
    
</xsl:stylesheet>
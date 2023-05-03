package spring.DTO;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

@JsonNaming
@Getter
@Setter
public class PredictDTO {
    private String location;
    private int month;
    private float temperature;
    private float humidity;
    private int locationCode;

    // setter
    public void setLocation(String value) {
        location = value;
        String[] locationCodes = new String[] {
                "강원도", "경기도", "경상남도", "경상북도", "광주광역시", "대구광역시", "부산광역시", "서울특별시", "세종특별자치시", "울산광역시", "인천광역시", "전라남도", "전라북도", "제주도", "충청남도", "충청북도"
        };

        for (int i = 0; i < locationCodes.length; i++) {
            String val = locationCodes[i];
            if (location.matches(val)) {
                locationCode = i;
                break;
            }
        }
    }
}
